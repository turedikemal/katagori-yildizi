(function(){
'use strict';
const crown='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAD4UlEQVR42u2WzW9UVRjGf885dzrD2FIwQym0kQYmJm4MTRMFV2oMcdq4cdOaKzY2LvwDRg0LF/4Bv8CNCxbGgphgQrVRSIwT02DMlJmBBDOlodPuXPftd8YLJ0Lfbp8dnXznve/7nud9z7k/8z3Jx7j5K/4V/4ofxX/iv+Lf8Vf4r/hX/BP9D0mSJInSb1G6Vqur6w8Bj4GbQBTYptU3W+3WJwA/gN9Aq4MYsNauKpUanr8MzAFngVPAQq3eC8A/0HMQizVLcNQqdf0q8BZ4ChwBMoB+3N8q9fg14E+grlVqJQPXp2eBg8DZYGK9jqhX7wH+AI8AeYlS3RbT7j7QhC7Uk7+HtgOpzG/cBW4FXgL3gQ+BrjYq7oW/7Q5jE8yM3Aw+ACeAqsZQvY2q1/8Ao8A6aG9Tq5V6+CnwcWAksdSpuAU4B44GKtlrrY7nVn8DtwAkgJqLWqXiSO32uA/8M1OpUPEgfZ3oO2A6kGFWvfCwL9fEu8A7YAvY6VbcTqf39U8CLwPGgVmtpm2psXwBuAmeApU7VxB3xGb/A14GTwHbgGWCvVvSK0up8wEqhVqcSl0cSx8z/QpvB6KM+EYKEXv4gEZr0A+M5p77YyglOdW21XosbGm0tR+TsA3uAX8HHgCPADeAEYOD64AIwEIgxa3WquR9MSbRFW3Fuc9jbclZwK9p9V6hLwqRJ5T0t2N2dPpI+4ug+XY+1iPRt+gD5yo8ZV8nFvb1aQ3x0qdFvLxOfrk4hN5O3V8hG+mhfQ3l1xjM8Cao1aHk5YY0Z/zt4n3za/te7YqnRl+pj4Qw+r4tz8VD4QmqLaXhc8zD7fH6SYD3b9evXjgGd6kH7xt2Vfph3fR5R+9SFpHUgvjxfnGoOeq7VbY85fTj6fZ7fd6N+Pj3HbLxyrx62MuFfB7Y70m31e6lP0nC8fgbB1ZHl+E+vnI4veH5fJGnj3jOlD+L4X38+2VD6C14uFyvFntMc6HMh+ZvY2r5gPnh5wFkHq0P0d1Kfbl7HLnbfA3Q3FH8blYZkbvmeNluYAWQt8Hr8ErgI/VOpVLW5fzSLJVa3Yc/F+jKdXSzUCtWrQ6p5PmfTzYj1SqVzFhX8c7yeekavV2qH9Vd3gXtE7uHQr8MniZ3cBE4DFwBLwCbgHVeh6V+7lms1h6DTkFxq0udJ3FWp3GfW+Mb8DpgqVLnXQn4Wm6Fzzt8/Qbzxtf5hf0V/8qv4V/wr/hX/iv+Ff8K/4V/wr/i3/FX+K/4V/wr/g3/BN9D8n/AZvfa5nWBpQAAAAASUVORK5CYII=';

function cleanPremiumTags(){
  document.querySelectorAll('.ky-premium-choice .ky-premium-tag').forEach(tag=>{
    tag.textContent='';
    tag.setAttribute('aria-label','Premium');
    tag.setAttribute('title','Premium');
  });
}

const css=document.createElement('style');
css.id='kyPremiumUiFix';
css.textContent=`
#v3Icons{overflow:visible!important}
.ky-premium-choice{overflow:visible!important;position:relative!important}
.ky-premium-tag{
  position:absolute!important;
  top:-8px!important;
  right:-7px!important;
  width:16px!important;
  height:16px!important;
  min-width:16px!important;
  max-width:16px!important;
  padding:0!important;
  margin:0!important;
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
  color:transparent!important;
  font-size:0!important;
  line-height:0!important;
  overflow:visible!important;
  transform:rotate(18deg)!important;
  transform-origin:center!important;
  z-index:20!important;
  pointer-events:none!important;
}
.ky-premium-tag::before{
  content:''!important;
  display:block!important;
  width:16px!important;
  height:16px!important;
  background-image:url('${crown}')!important;
  background-size:contain!important;
  background-position:center!important;
  background-repeat:no-repeat!important;
}
#kyIconFilterBar [data-filter="premium"]{
  position:relative!important;
  display:inline-flex!important;
  align-items:center!important;
  gap:4px!important;
  color:#ffb943!important;
  background:#fff!important;
  border-color:rgba(255,185,67,.45)!important;
}
#kyIconFilterBar [data-filter="premium"]::after{
  content:''!important;
  width:10px!important;
  height:10px!important;
  display:inline-block!important;
  background-image:url('${crown}')!important;
  background-size:contain!important;
  background-repeat:no-repeat!important;
  background-position:center!important;
  flex:0 0 auto!important;
}
#kyIconFilterBar [data-filter="premium"].active{
  background:#fff8e8!important;
  color:#ffb943!important;
  border-color:#ffb943!important;
  box-shadow:0 0 0 1px rgba(255,185,67,.08)!important;
}
`;
document.head.appendChild(css);
cleanPremiumTags();
const observer=new MutationObserver(()=>cleanPremiumTags());
observer.observe(document.body,{childList:true,subtree:true});
})();
