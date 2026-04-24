import {Stack, Button} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreateOutlinedIcon from '@mui/icons-material/CreateOutlined';
import { useState } from 'react';
const RATING_TO_INT = {'FIVE': 5, 'FOUR': 4, 'THREE': 3, 'TWO': 2, 'ONE': 1}

function SingleReview ({ review, locationsObj, status, backendUrl }) {
    const [replying, setReplying] = useState(false);
    const [replyValue, setReplyValue] = useState('reviewReply' in review?review.reviewReply.comment:'');
    const [submitColor, setSubmitColor] = useState('primary')

    const handleSubmit = async () => {
        console.log(replyValue);
        const rawResponse = await fetch(`${backendUrl}/review-reply`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({reviewName: review.name, reply: replyValue})
        });
        console.log(rawResponse);
        if (rawResponse.ok) {
            setSubmitColor('success');
            setReplying(false);
            console.log(rawResponse.status);
        } else {
            setSubmitColor('error');
            console.log(rawResponse.status);
        }
    }

    const handleSuggestResponse = async () => {
        console.log(replyValue);
        setReplying(true);
        const rawResponse = await fetch(`${backendUrl}/suggest-response`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({reviewContent: review.comment ? review.comment : '', mainCategory: locationsObj.current[review.name.split('/review')[0].split('locations/').slice(-1)[0]]['mainCategory'], starRating: RATING_TO_INT[review.starRating], 'reviewerName': review.reviewer.displayName, 'companyName': locationsObj.current[review.name.split('/review')[0].split('locations/').slice(-1)[0]]['gbp_name'], 'companyAddress': locationsObj.current[review.name.split('/review')[0].split('locations/').slice(-1)[0]]['address']})
        });
        console.log(rawResponse);
        if (rawResponse.ok) {
            const res = await rawResponse.json()
            setReplyValue(res['reviewResponse']);
            console.log(res);
        } else {
            console.log(rawResponse.status);
        }
    }

    return (
        <div className="review-wrapper" key={review.reviewId}>
            <Stack className="review-header" direction='row' justifyContent='space-between'>
                <Stack className="reviewer-info-wrapper" direction='row'>
                    <img src={review.reviewer.profilePhotoUrl} className="user-img" style={{borderRadius: '50%', height: '40px', width: '40px'}}/>
                    <Stack className="reviewer-name-stars-gmbname">
                        <Stack className="reviewer-stars" direction='row'>
                            <div className="reviewer-name-wrap"><span className="reviewer-name">{review.reviewer.displayName}</span></div>
                            <Stack className="stars" direction='row' spacing={0}>{Array(RATING_TO_INT[review.starRating]).fill(<StarIcon fontSize="small"/>)}{Array(5-RATING_TO_INT[review.starRating]).fill(<StarBorderIcon fontSize="small"/>)}</Stack>
                        </Stack>
                    <div className="location-name-review"><a href={`https://www.google.com/search?q=${locationsObj.current[review.name.split('/review')[0].split('locations/').slice(-1)[0]]['gbp_name']} (${locationsObj.current[review.name.split('/review')[0].split('locations/').slice(-1)[0]]['address']})`.replace('&', '%26')} target="_blank"><span className="location-name">{`${locationsObj.current[review.name.split('/review')[0].split('locations/').slice(-1)[0]]['gbp_name']} (${locationsObj.current[review.name.split('/review')[0].split('locations/').slice(-1)[0]]['address']})`}</span></a></div>
                    </Stack>
                </Stack>
                <div className="review-date-wrap"><span className="raview-date">{new Date(review.createTime.split('T')[0]).toLocaleDateString()}</span></div>
            </Stack>
            <div className="review-content-wrap"><span className="review-content">{review.comment}</span></div>
            {!replying && replyValue !== '' && <div className="review-response-wrap">
                <span className="review-response-content">{replyValue}</span>
            </div>}
            {replying && <div className='review-reply-editor'><textarea placeholder='Enter your reply here' rows='6' className='review-textarea' value={replyValue} onChange={(e) => setReplyValue(e.target.value)}></textarea></div>}
            <Stack className="review-footer" direction='row' justifyContent='flex-end' alignItems='center'>
                {status==='on' && <CheckCircleIcon color='success'/>}
                {(replying || (!replying && !('reviewReply' in review))) && <Button className="suggest-button" disabled={status==='off'?true:false} onClick={() => handleSuggestResponse()}>Suggest Reply</Button>}
                {replying && <Button className="cancel-button" onClick={() => {setReplying(!replying); setReplyValue('reviewReply' in review?review.reviewReply.comment:'');}}>cancel</Button>}
                {replying?<Button className="submit-button" variant="contained" color={submitColor} onClick={handleSubmit}>Submit</Button>:<Button className="reply-button" variant="contained" disabled={status==='off'?true:false} onClick={() => setReplying(true)} endIcon={<CreateOutlinedIcon />}>{'reviewReply' in review?'Edit Reply':'Reply'}</Button>}
            </Stack>
        </div>
    )
}

export default SingleReview