(function(){
var f=document.getElementById('lgf');
if(!f||f.querySelector('.lbrand'))return;
var brand=document.createElement('div'),form=document.createElement('div');
brand.className='lbrand';
form.className='lform';
['.lb','.lgb','.lgt','.lgc'].forEach(function(selector){
 var element=f.querySelector(selector);
 if(element)brand.appendChild(element);
});
var legacyArt=brand.querySelector('.lgb');
if(legacyArt)legacyArt.remove();
Array.prototype.slice.call(f.children).forEach(function(element){form.appendChild(element)});
f.appendChild(brand);
f.appendChild(form);
brand.querySelector('.lgt').insertAdjacentHTML('beforebegin',
 '<section class="vr-story" aria-label="Vriddhi introduction">'+
  '<div class="vr-story-visual" id="vr-story-visual">'+
   '<img src="modules/auth/family-story.svg?v=150" alt="A young woman, a child and an older woman sharing a hopeful moment as their savings grow">'+
   '<span class="vr-story-tag">The Vriddhi story</span>'+
   '<span class="vr-story-caption">One plan. Every generation.</span>'+
   '<span class="vr-story-caption" aria-hidden="true">Make room for the goals that matter.</span>'+
   '<span class="vr-story-caption" aria-hidden="true">Grow with confidence, together.</span>'+
  '</div>'+
  '<div class="vr-story-controls">'+
   '<button class="vr-story-toggle" id="vr-story-toggle" type="button" aria-controls="vr-story-visual" aria-pressed="false">'+
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8c0-.6.7-.9 1.2-.6l7.2 5c.5.3.5 1.1 0 1.5l-7.2 5c-.5.3-1.2 0-1.2-.6z"/></svg>'+
    '<span>Play 20-second story</span>'+
   '</button>'+
   '<span class="vr-story-duration">0:20</span>'+
   '<span class="vr-story-progress" aria-hidden="true"><i></i></span>'+
  '</div>'+
  '<p class="vr-story-hint">See how a clearer plan can bring your family’s goals together.</p>'+
 '</section>');
var toggle=document.getElementById('vr-story-toggle');
var visual=document.getElementById('vr-story-visual');
var picture=visual.querySelector('img');
var progress=visual.parentNode.querySelector('.vr-story-progress i');
var captions=visual.querySelectorAll('.vr-story-caption');
var label=toggle.querySelector('span');
var animations=[];
var progressAnimation=null;
if(!picture.animate||!progress.animate)toggle.parentNode.hidden=true;
toggle.addEventListener('click',function(){
  var playing=toggle.getAttribute('aria-pressed')!=='true';
  toggle.setAttribute('aria-pressed',String(playing));
  label.innerHTML=playing?'Pause story':'Play 20-second story';
  if(!picture.animate)return;
  if(!playing){animations.forEach(function(animation){animation.pause()});return}
  if(animations.length&&animations.every(function(animation){return animation.playState==='finished'})){
   animations.forEach(function(animation){animation.cancel()});
   animations=[];
  }
  if(!animations.length){
   animations.push(picture.animate([
    {transform:'scale(1) translateX(0)'},
    {transform:'scale(1.13) translateX(3%)',offset:.33},
    {transform:'scale(1.18) translateX(-6%)',offset:.67},
    {transform:'scale(1) translateX(0)'}
   ],{duration:20000,iterations:1,fill:'forwards'}));
   progressAnimation=progress.animate(
    [{transform:'scaleX(0)'},{transform:'scaleX(1)'}],
    {duration:20000,iterations:1,fill:'forwards'}
   );
   animations.push(progressAnimation);
   Array.prototype.forEach.call(captions,function(caption,index){
    var start=index/3,end=(index+1)/3,fade=.025;
    var frames=[
     {opacity:0,offset:0},
    {opacity:0,offset:Math.max(0,start-fade)},
    {opacity:1,offset:Math.min(1,start+fade)},
     {opacity:1,offset:index===2?1:Math.max(start,end-fade)},
     {opacity:index===2?1:0,offset:end}
    ];
    animations.push(caption.animate(frames,{duration:20000,iterations:1,fill:'forwards'}));
   });
   progressAnimation.onfinish=function(){
    toggle.setAttribute('aria-pressed','false');
    label.innerHTML='Replay 20-second story';
   };
  }
  animations.forEach(function(animation){animation.play()});
});
})();
