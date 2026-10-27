// Adapted from Oryzo ScreenPaint and Sketches GLSL. Kept tracked and standalone.
// Pencil alpha/luminance replaces its RGB atlas; stationary segments guard zero length.
// Input ink density is calibrated for the generated RGBA plates.
export const offerPaintFragment = `#define GLSLIFY 1
uniform sampler2D u_lowPaintTexture;uniform sampler2D u_prevPaintTexture;uniform vec2 u_paintTexelSize;uniform vec4 u_drawFrom;uniform vec4 u_drawTo;uniform float u_pushStrength;uniform vec3 u_dissipations;uniform vec2 u_vel;varying vec2 v_uv;vec2 sdSegment(in vec2 p,in vec2 a,in vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),0.00001),0.0,1.0);return vec2(length(pa-ba*h),h);}
#ifdef USE_NOISE
uniform float u_curlScale;uniform float u_curlStrength;vec2 hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy)*2.0-1.0;}vec3 noised(in vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);vec2 du=30.0*f*f*(f*(f-2.0)+1.0);vec2 ga=hash(i+vec2(0.0,0.0));vec2 gb=hash(i+vec2(1.0,0.0));vec2 gc=hash(i+vec2(0.0,1.0));vec2 gd=hash(i+vec2(1.0,1.0));float va=dot(ga,f-vec2(0.0,0.0));float vb=dot(gb,f-vec2(1.0,0.0));float vc=dot(gc,f-vec2(0.0,1.0));float vd=dot(gd,f-vec2(1.0,1.0));return vec3(va+u.x*(vb-va)+u.y*(vc-va)+u.x*u.y*(va-vb-vc+vd),ga+u.x*(gb-ga)+u.y*(gc-ga)+u.x*u.y*(ga-gb-gc+gd)+du*(u.yx*(va-vb-vc+vd)+vec2(vb,vc)-va));}
#endif
void main(){vec2 res=sdSegment(gl_FragCoord.xy,u_drawFrom.xy,u_drawTo.xy);vec2 radiusWeight=mix(u_drawFrom.zw,u_drawTo.zw,res.y);float d=1.0-smoothstep(-0.01,radiusWeight.x,res.x);vec4 lowData=texture2D(u_lowPaintTexture,v_uv);vec2 velInv=(0.5-lowData.xy)*u_pushStrength;
#ifdef USE_NOISE
vec3 noise3=noised(gl_FragCoord.xy*u_curlScale*(1.0-lowData.xy));vec2 noise=noised(gl_FragCoord.xy*u_curlScale*(2.0-lowData.xy*(0.5+noise3.x)+noise3.yz*0.1)).yz;velInv+=noise*(lowData.z+lowData.w)*u_curlStrength;
#endif
vec4 data=texture2D(u_prevPaintTexture,v_uv+velInv*u_paintTexelSize);data.xy-=0.5;vec4 delta=(u_dissipations.xxyz-1.0)*data;vec2 newVel=u_vel*d;delta+=vec4(newVel,radiusWeight.yy*d);delta.zw=sign(delta.zw)*max(vec2(0.004),abs(delta.zw));data+=delta;data.xy+=0.5;gl_FragColor=clamp(data,vec4(0.0),vec4(1.0));}`;

export const offerSketchFragment = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform sampler2D u_screenPaintTexture;uniform vec2 u_resolution;uniform vec3 u_mixer;uniform float u_opacity;uniform float u_activeRatio;uniform vec3 u_color;uniform float u_blur;varying vec2 v_uv;float pencil(sampler2D tex,vec2 uv){vec2 t=vec2(1./1024.,1./683.);vec4 l=texture2D(tex,uv-vec2(t.x,0.)),r=texture2D(tex,uv+vec2(t.x,0.)),b=texture2D(tex,uv-vec2(0.,t.y)),a=texture2D(tex,uv+vec2(0.,t.y));float vl=dot(l.rgb,vec3(.299,.587,.114))*l.a,vr=dot(r.rgb,vec3(.299,.587,.114))*r.a,vb=dot(b.rgb,vec3(.299,.587,.114))*b.a,va=dot(a.rgb,vec3(.299,.587,.114))*a.a;return clamp((abs(vl-vr)+abs(vb-va))*.65,0.,1.);}
vec3 sampleBlur(sampler2D tex,vec2 uv,vec2 texelSize,float blurAmount,float n){const float G=2.39996323;float gc=cos(G);float gs=sin(G);mat2 rot=mat2(gc,gs,-gs,gc);float initialAngle=n*6.28318530718;vec2 uvOffset=vec2(5./512.,0.);vec2 d=vec2(cos(initialAngle),sin(initialAngle));float sn=1.0/sqrt(float(BLUR_SAMPLE));vec2 s=texelSize*blurAmount*sn;vec3 c=vec3(0.);for(int i=0;i<BLUR_SAMPLE;i++){float r=sqrt(float(i+1));vec2 o=d*r*s;vec3 masks=c+=vec3(pencil(u_texture,uv+o-uvOffset),pencil(u_texture,uv+o),pencil(u_texture,uv+o+uvOffset));d=rot*d;}return c/float(BLUR_SAMPLE);}
#define GLSLIFY 1
uniform sampler2D u_blueNoiseTexture;uniform vec2 u_blueNoiseTexelSize;uniform vec2 u_blueNoiseCoordOffset;vec3 getBlueNoise(vec2 coord){return texture2D(u_blueNoiseTexture,coord*u_blueNoiseTexelSize+u_blueNoiseCoordOffset).rgb;}vec3 getStaticBlueNoise(vec2 coord){return texture2D(u_blueNoiseTexture,coord*u_blueNoiseTexelSize).rgb;}
void main(){vec3 blueNoise=getBlueNoise(gl_FragCoord.xy);vec2 screenUv=gl_FragCoord.xy/u_resolution;vec4 screenPaint=texture2D(u_screenPaintTexture,screenUv);float paint=smoothstep(0.1,0.3,0.5*(screenPaint.z+screenPaint.w));vec3 masks=sampleBlur(u_texture,v_uv,vec2(1./512.),15.*min((1.-paint),u_blur),blueNoise.z)*2.;float alpha=max(u_opacity,paint*(0.5+u_opacity*0.5)*2.)*masks.g*u_activeRatio;vec3 color=mix(u_color,(u_color*masks*0.75+masks*0.25),paint);gl_FragColor=vec4(min(vec3(1.),color*(1.+paint)),alpha);}`;


// Original Oryzo highPassFrag; halo and lens dirt are inactive in the product profile.
export const offerBloomHighPass = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform float u_luminosityThreshold;uniform float u_smoothWidth;uniform float u_lumaStrength;uniform float u_selectiveStrength;
#ifdef USE_HALO
uniform vec2 u_texelSize;uniform vec2 u_aspect;uniform float u_haloWidth;uniform float u_haloRGBShift;uniform vec3 u_haloLeftColor;uniform vec3 u_haloMidColor;uniform vec3 u_haloRightColor;uniform float u_haloStrength;uniform float u_haloMaskInner;uniform float u_haloMaskOuter;
#ifdef USE_LENS_DIRT
uniform sampler2D u_dirtTexture;uniform vec2 u_dirtAspect;
#endif
#endif
#ifdef USE_CONVOLUTION
uniform float u_convolutionBuffer;
#endif
varying vec2 v_uv;void main(){vec2 uv=v_uv;
#ifdef USE_CONVOLUTION
uv=(uv-0.5)*(1.0+u_convolutionBuffer)+0.5;
#endif
vec4 texel=texture2D(u_texture,uv);float luma=dot(texel.xyz,vec3(0.299,0.587,0.114));float alpha=smoothstep(u_luminosityThreshold,u_luminosityThreshold+u_smoothWidth,luma);vec3 color=texel.rgb*(alpha*u_lumaStrength+texel.a*u_selectiveStrength);gl_FragColor=vec4(color,1.0);
#ifdef USE_HALO
vec2 toCenter=(uv-0.5)*u_aspect;vec2 ghostUv=1.0-(toCenter+0.5);vec2 ghostVec=(vec2(0.5)-ghostUv);vec2 direction=normalize(ghostVec);vec2 haloVec=direction*u_haloWidth;float weight=length(vec2(0.5)-fract(ghostUv+haloVec));weight=pow(1.0-weight,3.0);vec3 distortion=vec3(-u_texelSize.x,0.0,u_texelSize.x)*u_haloRGBShift;float zoomBlurRatio=fract(atan(toCenter.y,toCenter.x)*40.0)*0.05+0.95;ghostUv*=zoomBlurRatio;vec2 haloUv=ghostUv+haloVec;vec3 halo=(texture2D(u_texture,haloUv+direction*distortion.r).rgb*u_haloLeftColor+texture2D(u_texture,haloUv+direction*distortion.g).rgb*u_haloMidColor+texture2D(u_texture,haloUv+direction*distortion.b).rgb*u_haloRightColor)*u_haloStrength*smoothstep(u_haloMaskInner,u_haloMaskOuter,length(toCenter));
#ifdef USE_LENS_DIRT
vec2 dirtUv=(uv-0.5)*u_dirtAspect+0.5;vec3 dirt=texture2D(u_dirtTexture,dirtUv).rgb;gl_FragColor.rgb+=(halo+alpha+0.05*dirt)*dirt;
#else
gl_FragColor.rgb+=halo;
#endif
#endif
#ifdef USE_CONVOLUTION
gl_FragColor.rgb*=max(abs(uv.x-0.5),abs(uv.y-0.5))>0.5 ? 0. : 1.;
#endif
}`;


// Original Oryzo bloomBlurFrag, unchanged.
export const offerBloomBlur = `#define GLSLIFY 1
varying vec2 v_uv;uniform sampler2D u_texture;uniform vec2 u_resolution;uniform vec2 u_direction;float gaussianPdf(in float x,in float sigma){return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;}void main(){vec2 invSize=1.0/u_resolution;float fSigma=float(SIGMA);float weightSum=gaussianPdf(0.0,fSigma);vec3 diffuseSum=texture2D(u_texture,v_uv).rgb*weightSum;for(int i=1;i<KERNEL_RADIUS;i++){float x=float(i);float w=gaussianPdf(x,fSigma);vec2 uvOffset=u_direction*invSize*x;vec3 sample1=texture2D(u_texture,v_uv+uvOffset).rgb;vec3 sample2=texture2D(u_texture,v_uv-uvOffset).rgb;diffuseSum+=(sample1+sample2)*w;weightSum+=2.0*w;}gl_FragColor=vec4(diffuseSum/weightSum,1.0);}`;


// Original Oryzo bloomCompositeFrag with Whoof ivory output and opaque graphite backdrop.
export const offerBloomComposite = `#define GLSLIFY 1
varying vec2 v_uv;uniform sampler2D u_texture;uniform sampler2D u_blurTexture0;
#if ITERATION > 1
uniform sampler2D u_blurTexture1;
#endif
#if ITERATION > 2
uniform sampler2D u_blurTexture2;
#endif
#if ITERATION > 3
uniform sampler2D u_blurTexture3;
#endif
#if ITERATION > 4
uniform sampler2D u_blurTexture4;
#endif
uniform float u_bloomWeights[ITERATION];uniform float u_saturation;
#include <common>
vec3 dithering(vec3 color){float grid_position=rand(gl_FragCoord.xy);vec3 dither_shift_RGB=vec3(0.25/255.0,-0.25/255.0,0.25/255.0);dither_shift_RGB=mix(2.0*dither_shift_RGB,-2.0*dither_shift_RGB,grid_position);return color+dither_shift_RGB;}void main(){vec4 color=texture2D(u_texture,v_uv);vec3 bloomColor=(u_bloomWeights[0]*texture2D(u_blurTexture0,v_uv)
#if ITERATION > 1
+u_bloomWeights[1]*texture2D(u_blurTexture1,v_uv)
#endif
#if ITERATION > 2
+u_bloomWeights[2]*texture2D(u_blurTexture2,v_uv)
#endif
#if ITERATION > 3
+u_bloomWeights[3]*texture2D(u_blurTexture3,v_uv)
#endif
#if ITERATION > 4
+u_bloomWeights[4]*texture2D(u_blurTexture4,v_uv)
#endif
).rgb;float luma=dot(bloomColor,vec3(0.299,0.587,0.114));color.rgb+=mix(vec3(luma),bloomColor,u_saturation);color.rgb=dithering(color.rgb);float ink=dot(color.rgb,vec3(.299,.587,.114));gl_FragColor=vec4(ink*vec3(1.04,1.015,.97)+vec3(11.,13.,15.)/255.,1.);}`;
