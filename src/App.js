import './App.css';
import * as React from 'react';
import {Stack, Chip, MenuItem, FormControl, Select, Button, Tooltip, ButtonBase, ToggleButtonGroup, ToggleButton } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoNotDisturbOnIcon from '@mui/icons-material/DoNotDisturbOn';
import LoadingButton from '@mui/lab/LoadingButton';
import SingleReview from './SingleReview';

const RATING_TO_INT = {'FIVE': 5, 'FOUR': 4, 'THREE': 3, 'TWO': 2, 'ONE': 1}
const BACKEND_URL = 'http://192.168.26.8:12500'

function App() {
  const [sort, setSort] = React.useState('');
  const [updateReady, setUpdateReady] = React.useState(false);
  const locationsObj = React.useRef({});
  const [locationsList, setLocationsList] = React.useState(null);
  const [reviews, setReviews] = React.useState({});
  const [reviewsList, setReviewsList] = React.useState([]);
  const reviewPage = React.useRef(1);
  const [activeLoc, setActiveLoc] = React.useState('*');
  const [activeLocStatus, setActiveLocStatus] = React.useState('');
  const activeLocStatusesObj = React.useRef({});
  const [fetching, setFetching] = React.useState(false);
  const [allClicked, setAllClicked] = React.useState(true);
  const [repliedClicked, setRepliedClicked] = React.useState(false);
  const [notRepliedClicked, setNotRepliedClicked] = React.useState(false);

  React.useEffect(() => {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.on('update-ready', () => setUpdateReady(true));
    return () => ipcRenderer.removeAllListeners('update-ready');
  }, []);

  React.useEffect(() => {
    async function getData() {
      await fetch(`${BACKEND_URL}/all-locations`).then(
        res => res.json().then(
          jsonres => {
            locationsObj.current = jsonres;
            var ordered = Object.keys(jsonres).map((gbp_id) => {
              let i = jsonres[gbp_id]
              i['gbp_id'] = gbp_id
              return i
            });
            console.log(ordered);
            ordered.sort((a,b) => (a.gbp_name.localeCompare(b.gbp_name)));
            console.log(ordered);
            setLocationsList(ordered);
          }
        )
      );
      await fetch(`${BACKEND_URL}/get-reviews`).then(
        res => res.json().then(
          jsonres => {
            console.log(jsonres);
            setReviews(jsonres);
            setReviewsList([...reviewsList, ...jsonres['reviews']]);
          }
        )
      );
      await fetch(`${BACKEND_URL}/get-statuses`).then(
        res => res.json().then(
          jsonres => {
            console.log(jsonres);
            activeLocStatusesObj.current = jsonres;
          }
        )
      );
    }
    getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleFetchReviews = async () => {
    setFetching(true);
    await fetch(`${BACKEND_URL}/fetch-new`).then(
      res => res.json().then(
        jsonres => {
          setReviews({'reviews': jsonres['reviews'], 'allReviews': jsonres['allReviews'], 'replied': jsonres['replied']});
          setReviewsList(jsonres['reviews']);
          locationsObj.current = jsonres['locations'];
          var ordered = Object.keys(jsonres['locations']).map((gbp_id) => {
            let i = jsonres['locations'][gbp_id]
            i['gbp_id'] = gbp_id
            return i
          });
          console.log(ordered);
          ordered.sort((a,b) => (a.gbp_name.localeCompare(b.gbp_name)));
          console.log(ordered);
          setLocationsList(ordered);
        }
      )
    );
    setFetching(false);
  }

  const handleLoadMore = async () => {
    reviewPage.current = reviewPage.current + 1;
    await fetch(`${BACKEND_URL}/get-reviews?gbpid=${activeLoc}&page=${reviewPage.current}`).then(
      res => res.json().then(
        jsonres => {
          console.log({'reviews': [...reviews['reviews'], ...jsonres['reviews']], 'allReviews': jsonres['allReviews'], 'replied': jsonres['replied']});
          setReviews({'reviews': [...reviews['reviews'], ...jsonres['reviews']], 'allReviews': jsonres['allReviews'], 'replied': jsonres['replied']});
          setReviewsList([...reviews['reviews'], ...jsonres['reviews']]);
        }
      )
    );
  }

  const handleAccountClick = async (loc) => {
    reviewPage.current = 1;
    console.log(loc);
    if (activeLoc === loc.gbp_id) {
      setActiveLoc('*');
      setActiveLocStatus(null);
      console.log('y');
    } else {
      setActiveLoc(loc.gbp_id);
    }
    if (loc.gbp_id in activeLocStatusesObj.current) {
      console.log(activeLocStatusesObj.current[loc.gbp_id]);
      setActiveLocStatus(activeLocStatusesObj.current[loc.gbp_id]);
    }
    await fetch(`${BACKEND_URL}/get-reviews?gbpid=${activeLoc === loc.gbp_id?'*':loc.gbp_id}`).then(
      res => res.json().then(
        jsonres => {
          console.log(jsonres);
          setReviews(jsonres);
          setReviewsList(jsonres['reviews']);
        }
      )
    );
    window.scrollTo(0, 0);
  }

  const handleFilterReviews = (filter) => {
    console.log(filter);
    console.log(reviews['reviews']);
    setReviewsList(filter === 'all'?reviews['reviews']:filter === 'replied'?reviews['reviews'].filter(review => 'reviewReply' in review):reviews['reviews'].filter(review => !('reviewReply' in review)));
    console.log(reviews['reviews']);
  }

  const sortReviews = (event) => {
    console.log(event.target.value);
    setSort(event.target.value);
    var sorted = [...reviewsList];
    setReviewsList(event.target.value === ''?sorted:event.target.value === 'lowest'?sorted.sort((a,b) => (RATING_TO_INT[a.starRating] - RATING_TO_INT[b.starRating])):sorted.sort((a,b) => (RATING_TO_INT[b.starRating] - RATING_TO_INT[a.starRating])));
  }

  const handleLocStatus = async (e, selected) => {
    console.log(selected);
    const rawResponse = await fetch(`${BACKEND_URL}/update-status`, {
      method: 'POST',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({gbpid: activeLoc, status: selected})
    });
    console.log(rawResponse);
    if (rawResponse.ok) {
        setActiveLocStatus(selected);
        let temp = activeLocStatusesObj.current;
        temp[activeLoc] = selected;
        activeLocStatusesObj.current = temp;
        console.log(rawResponse.status);
    } else {
        console.log(rawResponse.status);
    }
  }

  const handleRestartAndInstall = () => {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.invoke('restart-and-install');
  };

  return (
    <div className="App">
      {updateReady && (
        <div className="update-banner">
          An update has been downloaded —{' '}
          <button className="update-banner-button" onClick={handleRestartAndInstall}>Restart to install</button>
        </div>
      )}
      <Stack direction="row" className='page-wrapper' alignItems='flex-start' justifyContent='center' spacing={3}>
        <div className="sidebar sticky">
          <Stack direction="row" spacing={2} alignItems='center'>
            <h1 className="sidebar-label">Accounts</h1>
            {activeLoc!=='*'&&<ToggleButtonGroup
              value={activeLocStatus}
              exclusive
              onChange={handleLocStatus}
              size="small"
              aria-label="text alignment"
            >
              <ToggleButton value="on">
                <CheckCircleIcon color='success'/>
              </ToggleButton>
              <ToggleButton value="off">
                <DoNotDisturbOnIcon color='error'/>
              </ToggleButton>
            </ToggleButtonGroup>}
          </Stack>
          <div className="sidebar-accounts-list-wrapper">
            <Stack className='accounts-list' spacing={1} alignItems='flex-start' >
              {locationsList && locationsList.map((loc, i) =>
                (<ButtonBase className={activeLoc === loc.gbp_id?'account-wrap-wrapper-clickable-active':'account-wrap-wrapper-clickable'} onClick={() => handleAccountClick(loc)} key={i}>
                  <Tooltip title={`${loc.gbp_name} (${loc.address})`}>
                    <Stack direction="row" alignItems='center'className='account-wrap' spacing={1}>
                      <div className="account-name-wrap"><span className="account-name">{`${loc.gbp_name} (${loc.address})`}</span></div>
                      <Chip label={'totalReviewCount' in loc?(loc.totalReviewCount):(0)} color="info"/>
                      <Chip label={('averageRating' in loc)?((loc.averageRating).toFixed(1)):('0.0')} className='overall-rating'/>
                    </Stack>
                  </Tooltip>
                </ButtonBase>
              ))}
            </Stack>
          </div>
        </div>
        <div className="reviews-content">
          <div className="reviews-menu-filters">
            <Stack direction="row" spacing={2} alignItems='flex-start'>
              <Chip label={`All (${reviews['allReviews']})`} color={allClicked?"info":"default"} onClick={() => {setAllClicked(true);setRepliedClicked(false);setNotRepliedClicked(false);handleFilterReviews('all')}}/>
              <Chip label={`Replied (${reviews['replied']})`} color={repliedClicked?"info":"default"} onClick={() => {setAllClicked(false);setRepliedClicked(true);setNotRepliedClicked(false);handleFilterReviews('replied')}}/>
              <Chip label={`Haven't Replied (${reviews['allReviews'] - reviews['replied']})`} color={notRepliedClicked?"info":"default"} onClick={() => {setAllClicked(false);setRepliedClicked(false);setNotRepliedClicked(true);handleFilterReviews('notreplied')}}/>
              <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                <Select
                  id="demo-select-small"
                  value={sort}
                  displayEmpty={true}
                  onChange={sortReviews}
                  inputProps={{ 'aria-label': 'Without label' }}
                >
                  <MenuItem value="">
                    <em>Newest</em>
                  </MenuItem>
                  <MenuItem value={'lowest'}>Lowest</MenuItem>
                  <MenuItem value={'highest'}>Highest</MenuItem>
                </Select>
              </FormControl>
              <Stack className='fetchbutton-wrap' spacing={0} alignItems='flex-end'>
                <LoadingButton variant="contained" loading={fetching} onClick={handleFetchReviews} loadingIndicator="Fetching...">Fetch Latest Reviews</LoadingButton>
              </Stack>
            </Stack>
          </div>
          <div className="all-reviews">
            <Stack className="all-reviews-wrapper" spacing={2}>
              {reviewsList && reviewsList.map((review) => (
                <SingleReview review={review} locationsObj={locationsObj} status={review.name.split('/review')[0].split('locations/').slice(-1)[0] in activeLocStatusesObj.current?activeLocStatusesObj.current[review.name.split('/review')[0].split('locations/').slice(-1)[0]]:null} backendUrl={BACKEND_URL} key={review.reviewId}/>
              ))}
              <Button className="load-more-button" variant="contained" color='info' onClick={handleLoadMore}>Load More</Button>
            </Stack>
          </div>
        </div>
      </Stack>
    </div>
  );
}

export default App;
