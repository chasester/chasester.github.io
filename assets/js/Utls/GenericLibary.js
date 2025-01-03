// this get the user back to the home screen but if using this to open the window will cause a popup block notification
/* setInterval(()=>
{
    if(ResumeSelector.className === "active" && !ResumeActivating)
    {
        setTimeout(()=>{
            //ResumeActivating = false;
            window.open("#", "_self"); //send back to main menu
            winopen = window.open("https://resume.creddle.io/resume/5xk25r0nreq", "_blank"); // send to external link
            if (window.focus) {winopen.unfocus()}
            winopen.unfocus();
        }, 40);
    }
}, 20); */

//alt verison that doesnt trigger popup notifification on some chromium browsers.
// causes popup issue on IOS Chrome which is less then 0.5% of the market share
var DelayFocus = (url) => {
    
    setTimeout(()=>{
        ResumeActivating = true;
        currwindow = window;
        setTimeout(()=> {
            setTimeout(()=>
                {
                    window.location.hash = "";
                    window.location.reload();
                }, 500)
            //currwindow.open("#", "_self"); //send back to main menu
            winopen = window.open(url, "_blank"); // send to external link
            if (window.focus) {winopen.focus()}
        }, 50)
    }, 400)
    }