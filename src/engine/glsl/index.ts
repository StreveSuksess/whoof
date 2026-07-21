// GLSL extracted verbatim from legacy-mirror/_astro/hoisted.CRsATKbF.js.
// Do not edit by hand; names map to the source bundle's variables.

export const getBlueNoise = `#define GLSLIFY 1
uniform sampler2D u_blueNoiseTexture;uniform vec2 u_blueNoiseTexelSize;uniform vec2 u_blueNoiseCoordOffset;vec3 getBlueNoise(vec2 coord){return texture2D(u_blueNoiseTexture,coord*u_blueNoiseTexelSize+u_blueNoiseCoordOffset).rgb;}vec3 getStaticBlueNoise(vec2 coord){return texture2D(u_blueNoiseTexture,coord*u_blueNoiseTexelSize).rgb;}`;

export const getBgColor = `#define GLSLIFY 1
uniform vec3 u_bgColor0;uniform vec3 u_bgColor1;uniform vec2 u_bgOffset;uniform vec2 u_bgSize;uniform float u_clearColorRatio;uniform vec3 u_clearColor;vec3 getBgColor(float noise){vec2 aspect=vec2(1.0,u_resolution.y/u_resolution.x);vec2 screenUv=gl_FragCoord.xy/u_resolution-u_bgOffset;screenUv*=aspect;float d=length(screenUv/u_bgSize);d=clamp(d,0.0,1.0);vec3 color=mix(u_bgColor0,u_bgColor1,pow(1.0-d,4.0))+noise/255.0;color=mix(color,u_clearColor,u_clearColorRatio);return color;}`;

export const getGoboBlurRatio = `#define GLSLIFY 1
float getGoboBlurRatio(float ndcZ,vec4 p){return linearstep(p.x,p.y,(2.*p.x*p.w)/(p.w+p.x-ndcZ*(p.w-p.x)));}`;

export const linearstep = `#define GLSLIFY 1
float linearstep(float edge0,float edge1,float x){return clamp((x-edge0)/(edge1-edge0),0.,1.);}`;

export const sampleBlur = `#define GLSLIFY 1
vec4 sampleBlur(sampler2D tex,vec2 uv,vec2 texelSize,float blurAmount,float n){const float G=2.39996323;float gc=cos(G);float gs=sin(G);mat2 rot=mat2(gc,gs,-gs,gc);float initialAngle=n*6.28318530718;vec2 d=vec2(cos(initialAngle),sin(initialAngle));float sn=1.0/sqrt(float(BLUR_SAMPLE));vec2 s=texelSize*blurAmount*sn;vec4 c=vec4(0.);for(int i=0;i<BLUR_SAMPLE;i++){float r=sqrt(float(i+1));c+=texture2D(tex,uv+d*r*s);d=rot*d;}return c/float(BLUR_SAMPLE);}`;

export const sampleBlurSRGB = `#define GLSLIFY 1
vec4 sampleBlurSRGB(sampler2D tex,vec2 uv,vec2 texelSize,float blurAmount,float n){const float G=2.39996323;float gc=cos(G);float gs=sin(G);mat2 rot=mat2(gc,gs,-gs,gc);float initialAngle=n*6.28318530718;vec2 d=vec2(cos(initialAngle),sin(initialAngle));float sn=1.0/sqrt(float(BLUR_SAMPLE));vec2 s=texelSize*blurAmount*sn;vec4 c=vec4(0.);for(int i=0;i<BLUR_SAMPLE;i++){float r=sqrt(float(i+1));vec4 c0=texture2D(tex,uv+d*r*s);c0.rgb=pow(c0.rgb,vec3(2.2));c+=c0;d=rot*d;}return c/float(BLUR_SAMPLE);}`;

export const aces = `#define GLSLIFY 1
vec3 aces(vec3 color){const mat3 ACESInputMat=mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));const mat3 ACESOutputMat=mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));color=ACESInputMat*color;color=RRTAndODTFit(color);color=ACESOutputMat*color;return clamp(color,0.,1.);}`;

export const perturbNormalArb = `#define GLSLIFY 1
vec3 perturbNormalArb(vec3 surf_pos,vec3 surf_norm,vec2 dHdxy,float faceDirection){vec3 vSigmaX=normalize(dFdx(surf_pos.xyz));vec3 vSigmaY=normalize(dFdy(surf_pos.xyz));vec3 vN=surf_norm;vec3 R1=cross(vSigmaY,vN);vec3 R2=cross(vN,vSigmaX);float fDet=dot(vSigmaX,R1)*faceDirection;vec3 vGrad=sign(fDet)*(dHdxy.x*R1+dHdxy.y*R2);return normalize(abs(fDet)*surf_norm-vGrad);}`;

export const textureBicubic = `#define GLSLIFY 1
vec4 cubic(float v){vec4 n=vec4(1.0,2.0,3.0,4.0)-v;vec4 s=n*n*n;float x=s.x;float y=s.y-4.0*s.x;float z=s.z-4.0*s.y+6.0*s.x;float w=6.0-x-y-z;return vec4(x,y,z,w);}vec4 textureBicubic(sampler2D t,vec2 texCoords,vec2 textureSize){vec2 invTexSize=1.0/textureSize;texCoords=texCoords*textureSize-0.5;vec2 fxy=fract(texCoords);texCoords-=fxy;vec4 xcubic=cubic(fxy.x);vec4 ycubic=cubic(fxy.y);vec4 c=texCoords.xxyy+vec2(-0.5,1.5).xyxy;vec4 s=vec4(xcubic.xz+xcubic.yw,ycubic.xz+ycubic.yw);vec4 offset=c+vec4(xcubic.yw,ycubic.yw)/s;offset*=invTexSize.xxyy;vec4 sample0=texture2D(t,offset.xz);vec4 sample1=texture2D(t,offset.yz);vec4 sample2=texture2D(t,offset.xw);vec4 sample3=texture2D(t,offset.yw);float sx=s.x/(s.x+s.y);float sy=s.z/(s.z+s.w);return mix(mix(sample3,sample2,sx),mix(sample1,sample0,sx),sy);}vec4 textureBicubic(sampler2D t,vec2 texCoords,vec2 textureSize,vec4 clampRect){vec2 invTexSize=1.0/textureSize;texCoords=texCoords*textureSize-0.5;vec2 fxy=fract(texCoords);texCoords-=fxy;vec4 xcubic=cubic(fxy.x);vec4 ycubic=cubic(fxy.y);vec4 c=texCoords.xxyy+vec2(-0.5,1.5).xyxy;vec4 s=vec4(xcubic.xz+xcubic.yw,ycubic.xz+ycubic.yw);vec4 offset=c+vec4(xcubic.yw,ycubic.yw)/s;offset*=invTexSize.xxyy;vec4 sample0=texture2D(t,clamp(offset.xz,clampRect.xy,clampRect.zw));vec4 sample1=texture2D(t,clamp(offset.yz,clampRect.xy,clampRect.zw));vec4 sample2=texture2D(t,clamp(offset.xw,clampRect.xy,clampRect.zw));vec4 sample3=texture2D(t,clamp(offset.yw,clampRect.xy,clampRect.zw));float sx=s.x/(s.x+s.y);float sy=s.z/(s.z+s.w);return mix(mix(sample3,sample2,sx),mix(sample1,sample0,sx),sy);}`;

export const taaJitteringVert = `#define GLSLIFY 1
varying vec4 v_currentFramePosition;varying vec4 v_previousFramePosition;
#ifdef USE_TAA
uniform mat4 viewProjectionMatrix;uniform mat4 viewProjectionMatrixJittered;uniform mat4 prevViewProjectionMatrix;uniform mat4 prevModelMatrix;void getTAAPositions(vec3 pos,out vec4 outJitteredPosition,out vec4 currentFramePosition,out vec4 previousFramePosition){vec4 worldPosition=modelMatrix*vec4(pos,1.0);currentFramePosition=viewProjectionMatrix*worldPosition;vec4 prevWorldPosition=prevModelMatrix*vec4(pos,1.0);previousFramePosition=prevViewProjectionMatrix*prevWorldPosition;outJitteredPosition=viewProjectionMatrixJittered*modelMatrix*vec4(pos,1.0);}
#else
void getTAAPositions(vec3 pos,out vec4 outJitteredPosition,out vec4 currentFramePosition,out vec4 previousFramePosition){outJitteredPosition=projectionMatrix*modelViewMatrix*vec4(pos,1.0);currentFramePosition=outJitteredPosition;previousFramePosition=outJitteredPosition;}
#endif
`;

export const taaJitteringFrag = `#define GLSLIFY 1
gl_FragVelocity=calcTAAVelocity();`;

export const taaJitteringFragPars = `#define GLSLIFY 1
layout(location=1)out vec4 pc_fragVelocity;
#define gl_FragVelocity pc_fragVelocity
vec4 pack2HalfToRGBA(const in vec2 v){vec4 r=vec4(v.x,fract(v.x*255.0),v.y,fract(v.y*255.0));return vec4(r.x-r.y/255.0,r.y,r.z-r.w/255.0,r.w);}
#ifdef USE_TAA
varying vec4 v_currentFramePosition;varying vec4 v_previousFramePosition;vec4 calcTAAVelocity(){vec4 newPos=v_currentFramePosition;vec4 oldPos=v_previousFramePosition;newPos/=newPos.w;oldPos/=oldPos.w;vec2 velocity=(newPos.xy-oldPos.xy)*0.5;return pack2HalfToRGBA(velocity+0.5);}
#else
vec4 calcTAAVelocity(){return pack2HalfToRGBA(vec2(0.5));}
#endif
`;

export const blitVert = `#define GLSLIFY 1
attribute vec2 position;varying vec2 v_uv;void main(){v_uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;

export const blitFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;varying vec2 v_uv;void main(){gl_FragColor=texture2D(u_texture,v_uv);}`;

export const uvBlitVert = `#define GLSLIFY 1
attribute vec2 position;attribute vec2 uv;varying vec2 v_uv;void main(){v_uv=uv;gl_Position=vec4(position,0.0,1.0);}`;

export const clearFrag = `#define GLSLIFY 1
uniform vec4 u_color;varying vec2 v_uv;void main(){gl_FragColor=u_color;}`;

export const debugVert = `#define GLSLIFY 1
attribute vec3 position;attribute vec2 uv;uniform vec4 u_transform;varying vec2 v_uv;void main(){v_uv=uv;gl_Position=vec4(position.xy*u_transform.zw+u_transform.xy,0.0,1.0);}`;

export const bgVert = `#define GLSLIFY 1
varying vec2 v_uv;void main(){gl_Position=vec4(position.xy,0.0,1.0);v_uv=position.xy*0.5+0.5;}`;

export const bgFrag = `#define GLSLIFY 1
uniform vec2 u_resolution;uniform float u_opacity;
#include <getBlueNoise>
#include <getBgColor>
void main(){vec3 blueNoise=getBlueNoise(gl_FragCoord.xy);gl_FragColor=vec4(pow(getBgColor(blueNoise.z),vec3(1.0/2.2))+blueNoise/255.0,u_opacity);}`;

export const outVert = `#define GLSLIFY 1
varying vec2 v_uv;void main(){v_uv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}`;

export const outFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;varying vec2 v_uv;void main(){gl_FragColor=texture2D(u_texture,v_uv);}`;

export const rgbmFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform float u_maxRange;varying vec2 v_uv;void main(){vec4 value=texture2D(u_texture,v_uv);gl_FragColor=vec4(value.xyz*value.w*u_maxRange,1.0);}`;

export const channelMixerFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform vec4 u_channelMixerR;uniform vec4 u_channelMixerG;uniform vec4 u_channelMixerB;uniform vec4 u_channelMixerA;uniform vec2 u_uvScale;varying vec2 v_uv;void main(){vec4 color=texture2D(u_texture,fract(v_uv*u_uvScale));gl_FragColor=vec4(dot(color,u_channelMixerR),dot(color,u_channelMixerG),dot(color,u_channelMixerB),dot(color,u_channelMixerA));}`;

export const coasterVert = `#define GLSLIFY 1
attribute float Cd;varying vec3 v_viewNormal;varying vec2 v_uv;varying vec3 v_modelPosition;varying vec3 v_modelNormal;varying vec3 v_worldPosition;varying vec3 v_viewPosition;varying float v_ao;
#include <taaJitteringVert>
#ifdef USE_ZOOM
uniform float u_zoom;uniform vec2 u_zoomCenter;
#endif
void main(){vec3 pos=position;vec3 nor=normal;vec4 viewPosition=modelViewMatrix*vec4(pos,1.0);getTAAPositions(pos,gl_Position,v_currentFramePosition,v_previousFramePosition);
#ifdef USE_ZOOM
gl_Position.xyz/=gl_Position.w;gl_Position.xy=(gl_Position.xy-u_zoomCenter)*u_zoom+u_zoomCenter;gl_Position.xyz*=gl_Position.w;
#endif
v_viewNormal=normalMatrix*nor;v_uv=uv*3.;v_modelPosition=position;v_worldPosition=(modelMatrix*vec4(pos,1.0)).xyz;v_viewPosition=-viewPosition.xyz;v_modelNormal=normal;v_ao=Cd;}`;

export const coasterFrag = `#define GLSLIFY 1
#include <linearstep>
#include <textureBicubic>
varying vec3 v_viewNormal;varying vec2 v_uv;varying vec3 v_modelPosition;varying vec3 v_worldPosition;varying vec3 v_viewPosition;varying float v_ao;uniform sampler2D u_texture;uniform sampler2D u_envTexture;uniform sampler2D u_brdfLut;uniform vec3 u_localLightPosition;uniform vec2 u_textureSize;uniform sampler2D u_goboTexture;uniform mat4 u_goboMatrix;uniform float u_goboOpacity;uniform vec4 u_goboParams;
#include <getGoboBlurRatio>
uniform vec2 u_2DlightPos;uniform vec2 u_resolution;uniform sampler2D u_imgBasedTexture;uniform float u_imgBasedOpacity;uniform mat4 u_imgBasedMVP;uniform float u_highlightRatio;uniform float u_condomSceneRatio;uniform float u_wearableBlendingRatio;uniform float u_extraBumpScale;uniform sampler2D u_lmsTexture;uniform float u_time;uniform float u_heroRatio;float dot2(vec2 v){return dot(v,v);}float sdCappedCone(vec2 q,float h,float r1,float r2){vec2 k1=vec2(r2,h);vec2 k2=vec2(r2-r1,2.0*h);vec2 ca=vec2(q.x-min(q.x,(q.y<0.0)?r1:r2),abs(q.y)-h);vec2 cb=q-k1+k2*clamp(dot(k1-q,k2)/dot2(k2),0.0,1.0);float s=(cb.x<0.0&&ca.y<0.0)?-1.0 : 1.0;return s*sqrt(min(dot2(ca),dot2(cb)));}float opUnion(float d1,float d2){return min(d1,d2);}float opSubtraction(float d1,float d2){return max(-d1,d2);}float map(in vec3 pos){vec2 q=vec2(length(pos.xz),pos.y);float c1=sdCappedCone(q+vec2(0.,-.0102),.007,.0412,.0446);float c2=sdCappedCone(q+vec2(0.,-.0016),.0015,.0385,.039);float c3=sdCappedCone(q+vec2(0.,-.0155),.008,.038,.0395);return opSubtraction(c3,opUnion(c1,c2));}float calcSoftshadow(in vec3 ro,in vec3 rd,float mint,float maxt,float w){float res=1.0;float t=mint;for(int i=0;i<16&&t<maxt;i++){float h=map(ro+t*rd);res=min(res,h/(w*t));t+=clamp(h,0.0001,0.1);if(res<-1.||t>maxt)break;}res=max(res,-1.);res=0.25*(1.+res)*(1.+res)*(2.0-res);res=res*res*(3.0-2.0*res);return res;}
#include <getBlueNoise>
#include <sampleBlur>
#include <taaJitteringFragPars>
#include <perturbNormalArb>
#include <cart2Polar>
vec3 RRTAndODTFit(vec3 v){vec3 a=v*(v+0.0245786)-0.000090537;vec3 b=v*(0.983729*v+0.4329510)+0.238081;return a/b;}
#include <aces>
void main(){vec3 blueNoise=getBlueNoise(gl_FragCoord.xy);vec4 map=textureBicubic(u_texture,v_uv,u_textureSize);vec3 albedo=pow(map.rgb,vec3(mix(2.0,1.85,u_heroRatio)));vec3 viewNormal=normalize(v_viewNormal);float bumpScale=1.0+0.5*max(u_highlightRatio,u_condomSceneRatio)+u_extraBumpScale;vec2 dSTdx=dFdx(v_uv);vec2 dSTdy=dFdy(v_uv);vec2 dHdxy=(vec2(textureBicubic(u_texture,v_uv+dSTdx,u_textureSize).w,textureBicubic(u_texture,v_uv+dSTdy,u_textureSize).w)-map.w)*bumpScale;viewNormal=perturbNormalArb(-v_viewPosition,viewNormal,dHdxy,1.0);vec3 N=normalize((vec4(viewNormal,0.)*viewMatrix).xyz);vec3 V=normalize(cameraPosition-v_worldPosition);vec3 reflection=normalize(reflect(-V,N));float NdV=clamp(abs(dot(N,V)),0.001,1.0);vec3 f0=vec3(0.04);float roughness=1.0;float metallic=0.0;vec3 diffuseColor=albedo*(vec3(1.0)-f0)*(1.0-metallic);vec3 specularColor=mix(f0,albedo,metallic);vec3 brdf=texture2D(u_brdfLut,vec2(NdV,roughness)).rgb;vec3 diffuseLight=texture2D(u_envTexture,cart2Polar(N)).rgb;vec3 specularLight=texture2D(u_envTexture,cart2Polar(reflection)).rgb;float shadow=calcSoftshadow(v_modelPosition,normalize(u_localLightPosition),0.00001,0.08,mix(1.0,0.5,max(u_highlightRatio,u_condomSceneRatio)));vec3 appleColor=texture2D(u_lmsTexture,4.0*v_modelPosition.xy+blueNoise.xy*0.5-u_time).rgb;appleColor=mix(vec3(1.0),0.5+appleColor*0.5,u_highlightRatio);vec3 appleColor0=texture2D(u_lmsTexture,2.0*v_modelPosition.zy+blueNoise.xy*0.5-u_time).rgb;vec3 appleColor1=texture2D(u_lmsTexture,2.0*v_modelPosition.zy+blueNoise.xy*0.5+u_time).rgb;vec3 color=appleColor*(diffuseColor*diffuseLight+specularLight*(specularColor*brdf.x+brdf.y));float highlightIntensity=100.0;vec3 highlightPos=highlightIntensity*vec3(0.8,-0.9,-0.05);vec3 highlightL=normalize(highlightPos-v_worldPosition);float highlightNdL=max(0.0,dot(N,highlightL));color+=appleColor0*4.0*u_highlightRatio*albedo*highlightNdL;highlightPos=highlightIntensity*vec3(-0.7,-0.5,-0.2);highlightL=normalize(highlightPos-v_worldPosition);highlightNdL=max(0.0,dot(N,highlightL));color+=appleColor1*4.0*u_highlightRatio*albedo*highlightNdL;float gobo=1.0;vec4 goboNdc=u_goboMatrix*vec4(v_worldPosition,1.);goboNdc/=goboNdc.w;vec2 goboUv=goboNdc.xy*0.5+0.5;if(u_goboOpacity>0.&&goboUv.x>=0.0&&goboUv.x<=1.0&&goboUv.y>=0.0&&goboUv.y<=1.0){gobo=sampleBlur(u_goboTexture,goboUv,vec2(1./512.),getGoboBlurRatio(goboNdc.z,u_goboParams)*2.,blueNoise.z).r;gobo=mix(1.0,gobo,u_goboOpacity);}shadow=mix(shadow,0.6+0.4*shadow,u_heroRatio);color*=shadow*shadow*(0.5+0.3*gobo+0.2*v_ao);color*=mix(1.0,0.75,u_heroRatio);color+=mix(0.05,0.1,u_heroRatio)*albedo;color+=albedo*0.4*u_condomSceneRatio;vec3 wearableColor=4.0*pow(map.rgb,vec3(3.0-0.5*v_ao))*(0.05+0.95*smoothstep(0.0,0.3,shadow*shadow));color=mix(color,wearableColor,u_wearableBlendingRatio);gl_FragColor.rgb=color;gl_FragColor.rgb=aces(gl_FragColor.rgb);gl_FragColor.rgb=pow(gl_FragColor.rgb,vec3(1./2.2));vec4 imgBasedPos4=u_imgBasedMVP*vec4(v_modelPosition,1.0);vec3 imgBased=texture2D(u_imgBasedTexture,imgBasedPos4.xy/imgBasedPos4.w*0.5+0.5).rgb;gl_FragColor.a=0.;
#include <taaJitteringFrag>
}`;

export const coasterBlendFrag = `#define GLSLIFY 1
uniform sampler2D u_texture1;uniform sampler2D u_texture2;uniform float u_blendRatio;varying vec2 v_uv;void main(){gl_FragColor=mix(texture2D(u_texture1,v_uv),texture2D(u_texture2,v_uv),u_blendRatio);}`;

export const baseVert = `#define GLSLIFY 1
attribute vec3 position;uniform vec2 u_resolution;uniform vec2 u_heroViewResolution;uniform vec2 u_planeResolution;uniform float u_zoom;uniform float u_rotation;uniform mat4 u_screenToWorld;uniform float u_screenTableNDCDepth;varying vec2 v_uv;varying vec4 v_worldPos4;mat2 transform(float zoom,float angle){float s=sin(angle);float c=cos(angle);return mat2(c,-s,s,c)*zoom;}void main(){mat2 t=transform(1./u_zoom,-u_rotation);vec2 uv=position.xy*.5;uv.x*=u_resolution.x/u_resolution.y;uv=t*uv;uv*=u_heroViewResolution.y/u_planeResolution.xy;v_uv=uv+0.5;v_worldPos4=(u_screenToWorld*vec4(position.xy/u_zoom,u_screenTableNDCDepth,1.0));gl_Position=vec4(position.xy,0.0,1.0);}`;

export const baseFrag = `#define GLSLIFY 1
#include <linearstep>
uniform sampler2D u_texture;uniform sampler2D u_shadowMap;uniform sampler2D u_shadowCacheMap;uniform sampler2D u_deskPadTexture;uniform sampler2D u_goboTexture;uniform mat4 u_goboMatrix;uniform float u_goboOpacity;uniform vec4 u_goboParams;
#include <getGoboBlurRatio>
uniform vec2 u_resolution;uniform vec2 u_viewResolution;uniform vec2 u_planeResolution;uniform vec2 u_2DlightPos;uniform mat4 u_screenToWorld;uniform float u_screenTableNDCDepth;uniform float u_zoom;uniform float u_activeRatio;uniform vec3 u_coasterPos;uniform vec2 u_textureCorrection;uniform float u_blurRectRadius;uniform vec4 u_blurRect;uniform float u_blurRatio;uniform vec3 u_blurColor;uniform float u_useMobileLayout;varying vec2 v_uv;varying vec4 v_worldPos4;
#include <getBlueNoise>
#include <getBgColor>
#include <sampleBlur>
#include <rgb2hsb>
#include <hsb2rgb>
struct Ellipsoid{vec3 cen;vec3 rad;};float eliSoftShadow(in vec3 ro,in vec3 rd,in Ellipsoid sph,in float k){vec3 oc=ro-sph.cen;vec3 ocn=oc/sph.rad;vec3 rdn=rd/sph.rad;float a=dot(rdn,rdn);float b=dot(ocn,rdn);float c=dot(ocn,ocn);float h=b*b-a*(c-1.0);float t=(-b-sqrt(max(h,0.0)))/a;return(h>0.0)? step(t,0.0): smoothstep(0.0,1.0,-k*h/max(t,0.0));}float sdBox(in vec2 p,in vec2 b){vec2 d=abs(p)-b;return length(max(d,0.0))+min(max(d.x,d.y),0.0);}void main(){vec3 blueNoise=getBlueNoise(gl_FragCoord.xy);vec2 screenUv=gl_FragCoord.xy/u_resolution;vec2 texelSize=1.0/u_resolution;vec2 aspect=vec2(u_resolution.x/u_resolution.y,1.0);vec2 planeAspect=vec2(u_planeResolution.x/u_planeResolution.y,1.0);float outDist=sdBox((v_uv-.5)*planeAspect,planeAspect*.5*u_textureCorrection);vec2 baseUv=v_uv+(blueNoise.xy-.5)*planeAspect*max(0.,outDist)*0.5;vec2 px=screenUv*u_viewResolution;float blurRatio=linearstep(-u_blurRectRadius,0.,-sdBox(px-u_blurRect.xy,u_blurRect.zw*.5-u_blurRectRadius))*u_blurRatio;vec3 color=sampleBlur(u_texture,(baseUv-.5)/u_textureCorrection+.5,texelSize,blurRatio*blurRatio*blurRatio*u_resolution.y/50.,blueNoise.z).rgb;color=mix(color,u_blurColor,blurRatio*0.8);vec2 lightPos=vec2(0.0,0.0);float lightDist=length(lightPos-screenUv);float falloff=1.0/(1.0+0.3*lightDist*lightDist);vec4 shadowInfos=texture2D(u_shadowMap,screenUv);float shadow=(1.0-shadowInfos.r*falloff);vec3 worldPos=v_worldPos4.xyz/v_worldPos4.w;Ellipsoid sph=Ellipsoid(u_coasterPos,vec3(0.045,0.01,0.045));vec3 lightDir=normalize(vec3(1.2,0.8,-1.2));float coasterShadow=eliSoftShadow(worldPos,lightDir,sph,0.00001);coasterShadow=mix(1.,coasterShadow,u_activeRatio*u_activeRatio)*0.8+0.2;float gobo=1.0;vec4 goboNdc=u_goboMatrix*vec4(worldPos,1.);goboNdc/=goboNdc.w;vec2 goboUv=goboNdc.xy*0.5+0.5;if(u_goboOpacity>0.&&goboUv.x>=0.0&&goboUv.x<=1.0&&goboUv.y>=0.0&&goboUv.y<=1.0){gobo=sampleBlur(u_goboTexture,goboUv,vec2(1./512.),getGoboBlurRatio(goboNdc.z,u_goboParams)*2.,blueNoise.z).r;gobo=mix(1.0,gobo,u_goboOpacity);}float shade=mix(1.,shadow*coasterShadow*(0.5+0.5*gobo),0.975);vec3 hsb=rgb2hsb(color);hsb.g=min(hsb.g+(1.-shade)*0.1,1.);hsb.b*=shade;color.rgb=hsb2rgb(hsb);color=mix(color,vec3(0.0254,0.04299,0.01794),smoothstep(0.6,0.8,screenUv.y)*u_useMobileLayout);color=mix(getBgColor(blueNoise.z),color,u_activeRatio);gl_FragColor=vec4(pow(color,vec3(1.0/2.2)),0.);}`;

export const goboFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform float u_time;uniform float u_strength;varying vec2 v_uv;void main(){vec4 params=texture2D(u_texture,v_uv);float s=params.r;float amp1=params.g*u_strength;float phase1=(params.b-.5)*6.283185;float amp23=params.a*u_strength;vec3 waves=sin(u_time*vec3(1.,2.,3.)+phase1*vec3(1.,2.,.5));float motion=(amp1*waves.x)+(amp23*.5*waves.y)+(amp23*.3*waves.z);gl_FragColor=vec4(vec3(clamp(s+motion,0.,1.)),1.);}`;

export const hsb2rgb = `#define GLSLIFY 1
vec3 hsb2rgb(vec3 c){vec4 K=vec4(1.,2./3.,1./3.,3.);vec3 p=abs(fract(K.xyz+c.x)*6.-K.w);return c.z*mix(K.xxx,clamp(p-K.x,0.,1.),c.y);}`;

export const rgb2hsb = `#define GLSLIFY 1
vec3 rgb2hsb(vec3 c){vec4 K=vec4(0.0,-1.0/3.0,2.0/3.0,-1.0);vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g));vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r));float d=q.x-min(q.w,q.y);float e=1.0e-10;return vec3(abs(q.z+(q.w-q.y)/(6.0*d+e)),d/(q.x+e),q.x);}`;

export const cart2Polar = `#define GLSLIFY 1
vec2 cart2Polar(vec3 n){vec2 uv;uv.x=atan(n.z,n.x)*0.15915494+0.5;uv.y=asin(n.y)*0.31830988618+0.5;return uv;}`;

export const sampleHarmonics = `#define GLSLIFY 1
#ifndef TAU
#define TAU 6.2831852
#endif
float calcHarmonic(float amp,float pha,float freq,float t){return cos(t*freq+(pha-.5)*TAU)*amp;}float calcHarmonic(vec2 amp,vec2 pha,vec2 freq,float t){vec2 h=cos(t*freq+(pha-.5)*TAU)*amp;return h.x+h.y;}float sampleHarmonics(sampler2D tex,vec2 uv,vec2 freq,float t,float s){vec4 h=texture2D(tex,uv);return calcHarmonic(h.rb,h.ga,freq,t)*s;}float sampleHarmonics(sampler2D t0,sampler2D t1,vec2 uv,vec3 f,float t,float s){vec4 r=texture2D(t0,uv);return r.r+calcHarmonic(r.g,r.b,f.x,t)*s+sampleHarmonics(t1,uv,f.yz,t,s);}`;

export const sdCappedCone = `#define GLSLIFY 1
float sdCappedCone(vec3 p,vec3 a,vec3 b,float ra,float rb){float rba=rb-ra;float baba=dot(b-a,b-a);float papa=dot(p-a,p-a);float paba=dot(p-a,b-a)/baba;float x=sqrt(papa-paba*paba*baba);float cax=max(0.0,x-((paba<0.5)?ra:rb));float cay=abs(paba-0.5)-0.5;float k=rba*rba+baba;float f=clamp((rba*(x-ra)+paba*baba)/k,0.0,1.0);float cbx=x-ra-f*rba;float cby=paba-f;float s=(cbx<0.0&&cay<0.0)?-1.0 : 1.0;return s*sqrt(min(cax*cax+cay*cay*baba,cbx*cbx+cby*cby*baba));}`;

export const propsBlurFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform vec2 u_texelSize;uniform float u_blurRadius;varying vec2 v_uv;
#include <getBlueNoise>
#include <sampleBlur>
void main(){vec3 blueNoise=getBlueNoise(gl_FragCoord.xy);gl_FragColor=sampleBlur(u_texture,v_uv,u_texelSize,u_blurRadius,blueNoise.z);}`;

export const propVert = `#define GLSLIFY 1
uniform vec2 u_uvScale;uniform float u_uvHeightBias;uniform mat4 u_goboProjectionMatrix;uniform vec2 u_planeResolution;uniform float u_height;uniform sampler2D u_texture;uniform mat4 u_goboMatrix;uniform mat4 u_screenToWorld;uniform mat4 u_cameraMVP;uniform float u_zoom;varying vec4 v_goboNdc;varying vec2 v_uv;
#ifdef NEEDS_ANGULAR_RGB
uniform vec3 u_angleInfo;varying vec2 v_uv2;
#endif
void main(){v_uv=uv*u_uvScale;vec2 uvHeight=uv;uvHeight.x+=u_uvHeightBias;uvHeight*=u_uvScale;float height=texture2D(u_texture,uvHeight).r;
#ifdef NEEDS_ANGULAR_RGB
v_uv.x+=u_angleInfo.x*u_uvScale.x;v_uv2=uv*u_uvScale;v_uv2.x+=u_angleInfo.y*u_uvScale.x;
#endif
gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.0);vec4 tableNDC=u_cameraMVP*vec4(-0.0105761,0.7471+height*u_height,-0.0485146,1);tableNDC.xyz/=tableNDC.w;v_goboNdc=(u_goboMatrix*u_screenToWorld*vec4(gl_Position.xy/gl_Position.w/u_zoom,tableNDC.z,1.0));}`;

export const propFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;varying vec2 v_uv;
#ifdef IS_SHADOW
uniform float u_shadowOpacity;
#else
#include <linearstep>
uniform float u_activeRatio;uniform vec2 u_resolution;uniform vec2 u_2DlightPos;uniform sampler2D u_goboTexture;uniform mat4 u_goboProjectionMatrix;uniform float u_goboOpacity;uniform vec4 u_goboParams;
#include <getGoboBlurRatio>
varying vec4 v_goboNdc;
#include <getBlueNoise>
#include <getBgColor>
#include <sampleBlur>
#ifdef NEEDS_ANGULAR_RGB
uniform vec3 u_angleInfo;varying vec2 v_uv2;
#endif
#endif
void main(){vec4 color=pow(texture2D(u_texture,v_uv),vec4(2.2));
#ifdef IS_SHADOW
gl_FragColor=vec4(color.a*u_shadowOpacity);
#else
#ifdef NEEDS_ANGULAR_RGB
vec4 color2=pow(texture2D(u_texture,v_uv2),vec4(2.2));color=mix(color,color2,u_angleInfo.z);
#endif
vec2 texelSize=1.0/u_resolution;vec3 blueNoise=getBlueNoise(gl_FragCoord.xy);vec2 screenUv=gl_FragCoord.xy/u_resolution;vec2 lightPos=u_2DlightPos/u_resolution;float lightDist=length(lightPos-screenUv);float falloff=1.0/(1.0+0.3*lightDist*lightDist);float gobo=1.0;vec2 goboUv=v_goboNdc.xy/v_goboNdc.w*0.5+0.5;if(u_goboOpacity>0.&&goboUv.x>=0.0&&goboUv.x<=1.0&&goboUv.y>=0.0&&goboUv.y<=1.0){gobo=sampleBlur(u_goboTexture,goboUv,vec2(1./512.),getGoboBlurRatio(v_goboNdc.z,u_goboParams)*2.,blueNoise.z).r;gobo=mix(1.0,gobo,u_goboOpacity);}gl_FragColor=color;gl_FragColor.rgb*=0.5+0.5*gobo;gl_FragColor.rgb=mix(getBgColor(blueNoise.z),gl_FragColor.rgb,u_activeRatio);gl_FragColor.rgb=pow(gl_FragColor.rgb,vec3(1.0/2.2));
#endif
}`;

export const blur9VaryingVertexShader = `#define GLSLIFY 1
attribute vec3 position;uniform vec2 u_delta;varying vec2 v_uv[9];void main(){vec2 uv=position.xy*0.5+0.5;v_uv[0]=uv;vec2 delta=u_delta;v_uv[1]=uv-delta;v_uv[2]=uv+delta;delta+=u_delta;v_uv[3]=uv-delta;v_uv[4]=uv+delta;delta+=u_delta;v_uv[5]=uv-delta;v_uv[6]=uv+delta;delta+=u_delta;v_uv[7]=uv-delta;v_uv[8]=uv+delta;gl_Position=vec4(position,1.0);}`;

export const blur9VaryingFragmentShader = `#define GLSLIFY 1
uniform sampler2D u_texture;varying vec2 v_uv[9];void main(){vec4 color=texture2D(u_texture,v_uv[0])*0.1633;color+=texture2D(u_texture,v_uv[1])*0.1531;color+=texture2D(u_texture,v_uv[2])*0.1531;color+=texture2D(u_texture,v_uv[3])*0.12245;color+=texture2D(u_texture,v_uv[4])*0.12245;color+=texture2D(u_texture,v_uv[5])*0.0918;color+=texture2D(u_texture,v_uv[6])*0.0918;color+=texture2D(u_texture,v_uv[7])*0.051;color+=texture2D(u_texture,v_uv[8])*0.051;gl_FragColor=color;}`;

export const blur9FragmentShader = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform vec2 u_delta;varying vec2 v_uv;void main(){vec4 color=texture2D(u_texture,v_uv)*0.1633;vec2 delta=u_delta;color+=texture2D(u_texture,v_uv-delta)*0.1531;color+=texture2D(u_texture,v_uv+delta)*0.1531;delta+=u_delta;color+=texture2D(u_texture,v_uv-delta)*0.12245;color+=texture2D(u_texture,v_uv+delta)*0.12245;delta+=u_delta;color+=texture2D(u_texture,v_uv-delta)*0.0918;color+=texture2D(u_texture,v_uv+delta)*0.0918;delta+=u_delta;color+=texture2D(u_texture,v_uv-delta)*0.051;color+=texture2D(u_texture,v_uv+delta)*0.051;gl_FragColor=color;}`;

export const handVert = `#define GLSLIFY 1
varying vec3 v_viewNormal;varying vec3 v_worldPosition;varying vec2 v_uv1;varying vec2 v_uv2;varying vec3 v_viewPosition;varying vec3 v_modelPosition;attribute vec4 boneIndices;attribute vec4 boneWeights;attribute vec4 fingerWeights;uniform sampler2D u_skinPositionTexture;uniform sampler2D u_skinOrientTexture;uniform vec2 u_skinTextureSize;uniform vec2 u_uvOffset1;uniform vec2 u_uvOffset2;varying float v_f;varying vec4 v_fingerWeights;vec3 qrotate(vec4 q,vec3 v){return v+2.*cross(q.xyz,cross(q.xyz,v)+q.w*v);}void applySkin(inout vec3 pos,inout vec3 nor,float boneIndex,float boneWeight){vec2 skinUv=vec2(boneIndex+.5,.5)/u_skinTextureSize;vec4 quat=texture2D(u_skinOrientTexture,skinUv);pos+=(qrotate(quat,position)+texture2D(u_skinPositionTexture,skinUv).xyz)*boneWeight;nor+=qrotate(quat,normal)*boneWeight;}
#include <taaJitteringVert>
void main(){vec3 pos=vec3(0.);vec3 nor=vec3(0.);applySkin(pos,nor,boneIndices.x,boneWeights.x);applySkin(pos,nor,boneIndices.y,boneWeights.y);applySkin(pos,nor,boneIndices.z,boneWeights.z);applySkin(pos,nor,boneIndices.w,boneWeights.w);vec4 viewPos=modelViewMatrix*vec4(pos,1.0);getTAAPositions(pos,gl_Position,v_currentFramePosition,v_previousFramePosition);v_uv1=uv*0.5+u_uvOffset1;v_uv2=uv*0.5+u_uvOffset2;v_viewPosition=-viewPos.xyz;v_viewNormal=normalMatrix*nor;v_worldPosition=(modelMatrix*vec4(pos,1.0)).xyz;v_f=dot(normal,normalize(vec3(.6,.5,0.)+position*8.));v_modelPosition=position;v_fingerWeights=fingerWeights;}`;

export const handFrag = `#define GLSLIFY 1
varying vec3 v_viewNormal;varying vec2 v_uv1;varying vec2 v_uv2;varying vec3 v_modelPosition;varying vec3 v_worldPosition;varying vec3 v_viewPosition;varying float v_f;uniform sampler2D u_handTexture;uniform float u_animationRatio;uniform vec3 u_rimColor;uniform float u_uvBlend;uniform vec2 u_resolution;uniform float u_haloLightStrength;uniform float u_opacity;uniform float u_highlightRatio;uniform sampler2D u_lmsTexture;uniform float u_time;varying vec4 v_fingerWeights;uniform vec4 u_fingerWeights;
#include <linearstep>
#include <getBlueNoise>
#include <getBgColor>
#include <taaJitteringFragPars>
void main(){vec3 blueNoise=getBlueNoise(gl_FragCoord.xy);vec3 viewNormal=normalize(v_viewNormal);vec3 N=normalize((vec4(viewNormal,0.)*viewMatrix).xyz);vec3 V=normalize(cameraPosition-v_worldPosition);vec3 rimColor=pow(u_rimColor,vec3(2.2));vec3 albedo=mix(texture2D(u_handTexture,v_uv1).rgb,texture2D(u_handTexture,v_uv2).rgb,max(min(1.,dot(u_fingerWeights,v_fingerWeights)),u_uvBlend));float lumaPerceptual=dot(albedo,vec3(0.2126,0.7152,0.0722));float lumaLinear=dot(albedo,vec3(0.2126,0.7152,0.0722));float luma=mix(lumaPerceptual,lumaLinear,0.9);float lightIntensity=300.0*u_highlightRatio;float specularPower=50.0;float scatterIntensity=100.0*u_highlightRatio;float scatterPower=4.0;float scatterDistortion=0.5;vec3 appleColor0=texture2D(u_lmsTexture,4.0*v_modelPosition.yz+blueNoise.xy*0.5-u_time).rgb;vec3 appleColor1=texture2D(u_lmsTexture,4.0*v_modelPosition.yz+blueNoise.xy*0.5+u_time).rgb;vec3 color=albedo+u_highlightRatio*albedo*mix(appleColor0,appleColor1,0.5);vec3 lightPos=100.0*vec3(0.8,-0.9,-0.05);vec3 L=normalize(lightPos-v_worldPosition);vec3 H=normalize(V+L);float NdH=max(0.0,dot(N,H));float NdL=max(0.0,dot(N,L));float spec=pow(NdH,specularPower);float totalSpec=spec;color+=appleColor0*0.4*lightIntensity*luma*NdL*spec;float backNdL=max(0.0,dot(-N,L));vec3 scatterDir=normalize(L+N*scatterDistortion);float scatter=pow(max(0.0,dot(V,-scatterDir)),scatterPower);color+=2.0*scatterIntensity*luma*rimColor*scatter*backNdL;lightPos=100.0*vec3(-0.7,-0.5,-0.2);L=normalize(lightPos-v_worldPosition);H=normalize(V+L);NdH=max(0.0,dot(N,H));NdL=max(0.0,dot(N,L));spec=pow(NdH,specularPower);totalSpec+=spec;color+=appleColor1*lightIntensity*luma*NdL*spec;backNdL=max(0.0,dot(-N,L));scatterDir=normalize(L+N*scatterDistortion);scatter=pow(max(0.0,dot(V,-scatterDir)),scatterPower);color+=3.0*scatterIntensity*luma*rimColor*scatter*backNdL;gl_FragColor=vec4(color,min(1.,totalSpec*2.));float screenY=gl_FragCoord.y/u_resolution.y;float opacity=smoothstep(0.,1.,u_opacity*2.-(.5-min(.5,screenY)*2.));gl_FragColor.rgb=mix(getBgColor(blueNoise.z),gl_FragColor.rgb,opacity);gl_FragColor.rgb=pow(gl_FragColor.rgb,vec3(1.0/2.2));
#include <taaJitteringFrag>
}`;

export const fxaaFrag = `#define GLSLIFY 1
#define FXAA_QUALITY_P0 1.0
#define FXAA_QUALITY_P1 1.5
#define FXAA_QUALITY_P2 2.0
#define FXAA_QUALITY_P3 4.0
#define FXAA_QUALITY_P4 12.0
#define FxaaBool bool
#define FxaaFloat float
#define FxaaFloat2 vec2
#define FxaaFloat3 vec3
#define FxaaFloat4 vec4
#define FxaaHalf float
#define FxaaHalf2 vec2
#define FxaaHalf3 vec3
#define FxaaHalf4 vec4
#define FxaaInt2 vec2
#define FxaaTex sampler2D
#define FxaaSat(x) clamp(x, 0.0, 1.0)
#define FxaaTexTop(t, p) texture2D(t, p)
#define FxaaTexOff(t, p, o, r) texture2D(t, p + (o * r))
FxaaFloat FxaaLuma(FxaaFloat4 rgba){return rgba.y;}FxaaFloat4 FxaaPixelShader(FxaaFloat2 pos,FxaaTex tex,FxaaFloat2 fxaaQualityRcpFrame,FxaaFloat fxaaQualitySubpix,FxaaFloat fxaaQualityEdgeThreshold,FxaaFloat fxaaQualityEdgeThresholdMin){FxaaFloat2 posM;posM.x=pos.x;posM.y=pos.y;FxaaFloat4 rgbyM=FxaaTexTop(tex,posM);
#define lumaM rgbyM.y
FxaaFloat lumaS=FxaaLuma(FxaaTexOff(tex,posM,FxaaInt2(0,1),fxaaQualityRcpFrame.xy));FxaaFloat lumaE=FxaaLuma(FxaaTexOff(tex,posM,FxaaInt2(1,0),fxaaQualityRcpFrame.xy));FxaaFloat lumaN=FxaaLuma(FxaaTexOff(tex,posM,FxaaInt2(0,-1),fxaaQualityRcpFrame.xy));FxaaFloat lumaW=FxaaLuma(FxaaTexOff(tex,posM,FxaaInt2(-1,0),fxaaQualityRcpFrame.xy));FxaaFloat maxSM=max(lumaS,lumaM);FxaaFloat minSM=min(lumaS,lumaM);FxaaFloat maxESM=max(lumaE,maxSM);FxaaFloat minESM=min(lumaE,minSM);FxaaFloat maxWN=max(lumaN,lumaW);FxaaFloat minWN=min(lumaN,lumaW);FxaaFloat rangeMax=max(maxWN,maxESM);FxaaFloat rangeMin=min(minWN,minESM);FxaaFloat rangeMaxScaled=rangeMax*fxaaQualityEdgeThreshold;FxaaFloat range=rangeMax-rangeMin;FxaaFloat rangeMaxClamped=max(fxaaQualityEdgeThresholdMin,rangeMaxScaled);FxaaBool earlyExit=range<rangeMaxClamped;if(earlyExit)return rgbyM;FxaaFloat lumaNW=FxaaLuma(FxaaTexOff(tex,posM,FxaaInt2(-1,-1),fxaaQualityRcpFrame.xy));FxaaFloat lumaSE=FxaaLuma(FxaaTexOff(tex,posM,FxaaInt2(1,1),fxaaQualityRcpFrame.xy));FxaaFloat lumaNE=FxaaLuma(FxaaTexOff(tex,posM,FxaaInt2(1,-1),fxaaQualityRcpFrame.xy));FxaaFloat lumaSW=FxaaLuma(FxaaTexOff(tex,posM,FxaaInt2(-1,1),fxaaQualityRcpFrame.xy));FxaaFloat lumaNS=lumaN+lumaS;FxaaFloat lumaWE=lumaW+lumaE;FxaaFloat subpixRcpRange=1.0/range;FxaaFloat subpixNSWE=lumaNS+lumaWE;FxaaFloat edgeHorz1=(-2.0*lumaM)+lumaNS;FxaaFloat edgeVert1=(-2.0*lumaM)+lumaWE;FxaaFloat lumaNESE=lumaNE+lumaSE;FxaaFloat lumaNWNE=lumaNW+lumaNE;FxaaFloat edgeHorz2=(-2.0*lumaE)+lumaNESE;FxaaFloat edgeVert2=(-2.0*lumaN)+lumaNWNE;FxaaFloat lumaNWSW=lumaNW+lumaSW;FxaaFloat lumaSWSE=lumaSW+lumaSE;FxaaFloat edgeHorz4=(abs(edgeHorz1)*2.0)+abs(edgeHorz2);FxaaFloat edgeVert4=(abs(edgeVert1)*2.0)+abs(edgeVert2);FxaaFloat edgeHorz3=(-2.0*lumaW)+lumaNWSW;FxaaFloat edgeVert3=(-2.0*lumaS)+lumaSWSE;FxaaFloat edgeHorz=abs(edgeHorz3)+edgeHorz4;FxaaFloat edgeVert=abs(edgeVert3)+edgeVert4;FxaaFloat subpixNWSWNESE=lumaNWSW+lumaNESE;FxaaFloat lengthSign=fxaaQualityRcpFrame.x;FxaaBool horzSpan=edgeHorz>=edgeVert;FxaaFloat subpixA=subpixNSWE*2.0+subpixNWSWNESE;if(!horzSpan)lumaN=lumaW;if(!horzSpan)lumaS=lumaE;if(horzSpan)lengthSign=fxaaQualityRcpFrame.y;FxaaFloat subpixB=(subpixA*(1.0/12.0))-lumaM;FxaaFloat gradientN=lumaN-lumaM;FxaaFloat gradientS=lumaS-lumaM;FxaaFloat lumaNN=lumaN+lumaM;FxaaFloat lumaSS=lumaS+lumaM;FxaaBool pairN=abs(gradientN)>=abs(gradientS);FxaaFloat gradient=max(abs(gradientN),abs(gradientS));if(pairN)lengthSign=-lengthSign;FxaaFloat subpixC=FxaaSat(abs(subpixB)*subpixRcpRange);FxaaFloat2 posB;posB.x=posM.x;posB.y=posM.y;FxaaFloat2 offNP;offNP.x=(!horzSpan)? 0.0 : fxaaQualityRcpFrame.x;offNP.y=(horzSpan)? 0.0 : fxaaQualityRcpFrame.y;if(!horzSpan)posB.x+=lengthSign*0.5;if(horzSpan)posB.y+=lengthSign*0.5;FxaaFloat2 posN;posN.x=posB.x-offNP.x*FXAA_QUALITY_P0;posN.y=posB.y-offNP.y*FXAA_QUALITY_P0;FxaaFloat2 posP;posP.x=posB.x+offNP.x*FXAA_QUALITY_P0;posP.y=posB.y+offNP.y*FXAA_QUALITY_P0;FxaaFloat subpixD=((-2.0)*subpixC)+3.0;FxaaFloat lumaEndN=FxaaLuma(FxaaTexTop(tex,posN));FxaaFloat subpixE=subpixC*subpixC;FxaaFloat lumaEndP=FxaaLuma(FxaaTexTop(tex,posP));if(!pairN)lumaNN=lumaSS;FxaaFloat gradientScaled=gradient*1.0/4.0;FxaaFloat lumaMM=lumaM-lumaNN*0.5;FxaaFloat subpixF=subpixD*subpixE;FxaaBool lumaMLTZero=lumaMM<0.0;lumaEndN-=lumaNN*0.5;lumaEndP-=lumaNN*0.5;FxaaBool doneN=abs(lumaEndN)>=gradientScaled;FxaaBool doneP=abs(lumaEndP)>=gradientScaled;if(!doneN)posN.x-=offNP.x*FXAA_QUALITY_P1;if(!doneN)posN.y-=offNP.y*FXAA_QUALITY_P1;FxaaBool doneNP=(!doneN)||(!doneP);if(!doneP)posP.x+=offNP.x*FXAA_QUALITY_P1;if(!doneP)posP.y+=offNP.y*FXAA_QUALITY_P1;if(doneNP){if(!doneN)lumaEndN=FxaaLuma(FxaaTexTop(tex,posN.xy));if(!doneP)lumaEndP=FxaaLuma(FxaaTexTop(tex,posP.xy));if(!doneN)lumaEndN=lumaEndN-lumaNN*0.5;if(!doneP)lumaEndP=lumaEndP-lumaNN*0.5;doneN=abs(lumaEndN)>=gradientScaled;doneP=abs(lumaEndP)>=gradientScaled;if(!doneN)posN.x-=offNP.x*FXAA_QUALITY_P2;if(!doneN)posN.y-=offNP.y*FXAA_QUALITY_P2;doneNP=(!doneN)||(!doneP);if(!doneP)posP.x+=offNP.x*FXAA_QUALITY_P2;if(!doneP)posP.y+=offNP.y*FXAA_QUALITY_P2;if(doneNP){if(!doneN)lumaEndN=FxaaLuma(FxaaTexTop(tex,posN.xy));if(!doneP)lumaEndP=FxaaLuma(FxaaTexTop(tex,posP.xy));if(!doneN)lumaEndN=lumaEndN-lumaNN*0.5;if(!doneP)lumaEndP=lumaEndP-lumaNN*0.5;doneN=abs(lumaEndN)>=gradientScaled;doneP=abs(lumaEndP)>=gradientScaled;if(!doneN)posN.x-=offNP.x*FXAA_QUALITY_P3;if(!doneN)posN.y-=offNP.y*FXAA_QUALITY_P3;doneNP=(!doneN)||(!doneP);if(!doneP)posP.x+=offNP.x*FXAA_QUALITY_P3;if(!doneP)posP.y+=offNP.y*FXAA_QUALITY_P3;if(doneNP){if(!doneN)lumaEndN=FxaaLuma(FxaaTexTop(tex,posN.xy));if(!doneP)lumaEndP=FxaaLuma(FxaaTexTop(tex,posP.xy));if(!doneN)lumaEndN=lumaEndN-lumaNN*0.5;if(!doneP)lumaEndP=lumaEndP-lumaNN*0.5;doneN=abs(lumaEndN)>=gradientScaled;doneP=abs(lumaEndP)>=gradientScaled;if(!doneN)posN.x-=offNP.x*FXAA_QUALITY_P4;if(!doneN)posN.y-=offNP.y*FXAA_QUALITY_P4;doneNP=(!doneN)||(!doneP);if(!doneP)posP.x+=offNP.x*FXAA_QUALITY_P4;if(!doneP)posP.y+=offNP.y*FXAA_QUALITY_P4;}}}FxaaFloat dstN=posM.x-posN.x;FxaaFloat dstP=posP.x-posM.x;if(!horzSpan)dstN=posM.y-posN.y;if(!horzSpan)dstP=posP.y-posM.y;FxaaBool goodSpanN=(lumaEndN<0.0)!=lumaMLTZero;FxaaFloat spanLength=(dstP+dstN);FxaaBool goodSpanP=(lumaEndP<0.0)!=lumaMLTZero;FxaaFloat spanLengthRcp=1.0/spanLength;FxaaBool directionN=dstN<dstP;FxaaFloat dst=min(dstN,dstP);FxaaBool goodSpan=directionN ? goodSpanN : goodSpanP;FxaaFloat subpixG=subpixF*subpixF;FxaaFloat pixelOffset=(dst*(-spanLengthRcp))+0.5;FxaaFloat subpixH=subpixG*fxaaQualitySubpix;FxaaFloat pixelOffsetGood=goodSpan ? pixelOffset : 0.0;FxaaFloat pixelOffsetSubpix=max(pixelOffsetGood,subpixH);if(!horzSpan)posM.x+=pixelOffsetSubpix*lengthSign;if(horzSpan)posM.y+=pixelOffsetSubpix*lengthSign;return FxaaFloat4(FxaaTexTop(tex,posM).xyz,lumaM);}varying vec2 v_uv;uniform sampler2D u_texture;uniform vec2 u_texelSize;const float fxaaQualitySubpix=0.5;const float fxaaQualityEdgeThreshold=0.125;const float fxaaQualityEdgeThresholdMin=0.0833;void main(){vec2 fxaaQualityRcpFrame=u_texelSize;vec4 color=FxaaPixelShader(v_uv,u_texture,fxaaQualityRcpFrame,fxaaQualitySubpix,fxaaQualityEdgeThreshold,fxaaQualityEdgeThresholdMin);
#ifdef SKIP_ALPHA
float alpha=texture2D(u_texture,v_uv).a;gl_FragColor=vec4(color.rgb,alpha);
#else
gl_FragColor=color;
#endif
}`;

export const taaResolveFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform sampler2D u_historyTexture;uniform highp sampler2D u_velocityTexture;uniform vec2 u_resolution;uniform float u_historyWeight;varying vec2 v_uv;vec2 unpackRGBATo2Half(const in vec4 v){return vec2(v.x+(v.y/255.0),v.z+(v.w/255.0));}vec4 AdjustHDRColor(vec4 color){float luminance=dot(color.rgb,vec3(0.299,0.587,0.114));float luminanceWeight=1.0/(1.0+luminance);return vec4(color.rgb*luminanceWeight,color.a);}vec4 SampleHistoryCatmullRom(sampler2D tex,vec2 uv,vec2 texelSize){vec2 position=uv*u_resolution;vec2 centerPosition=floor(position-0.5)+0.5;vec2 f=position-centerPosition;vec2 f2=f*f;vec2 f3=f2*f;vec2 w0=f2-0.5*(f3+f);vec2 w1=1.5*f3-2.5*f2+1.0;vec2 w3=0.5*(f3-f2);vec2 w2=1.0-w0-w1-w3;vec2 s0=w0+w1;vec2 s1=w2+w3;vec2 f0=w1/s0;vec2 f1=w3/s1;vec2 t0=(centerPosition-1.0+f0)*texelSize;vec2 t1=(centerPosition+1.0+f1)*texelSize;return(texture2D(tex,vec2(t0.x,t0.y))*s0.x+texture2D(tex,vec2(t1.x,t0.y))*s1.x)*s0.y+(texture2D(tex,vec2(t0.x,t1.y))*s0.x+texture2D(tex,vec2(t1.x,t1.y))*s1.x)*s1.y;}void main(){vec2 texelSize=1.0/u_resolution;vec4 velocityRaw=texture2D(u_velocityTexture,v_uv);vec2 velocity=unpackRGBATo2Half(velocityRaw)-0.5;vec2 previousPixelPos=v_uv-velocity;vec4 currentColor=texture2D(u_texture,v_uv);vec4 historyColorWeighted=SampleHistoryCatmullRom(u_historyTexture,previousPixelPos,texelSize);if(any(lessThan(previousPixelPos,vec2(0.0)))||any(greaterThan(previousPixelPos,vec2(1.0)))){historyColorWeighted=currentColor;}vec4 minColor=vec4(9999.0);vec4 maxColor=vec4(-9999.0);for(int x=-1;x<=1;++x){for(int y=-1;y<=1;++y){vec4 neighbor=texture2D(u_texture,v_uv+vec2(x,y)*texelSize);minColor=min(minColor,neighbor);maxColor=max(maxColor,neighbor);}}historyColorWeighted=clamp(historyColorWeighted,minColor,maxColor);vec4 blendedColor=(currentColor*(1.0-u_historyWeight)+historyColorWeighted*u_historyWeight);gl_FragColor=blendedColor;}`;

export const finalFrag = `#define GLSLIFY 1
varying vec2 v_uv;uniform sampler2D u_texture;uniform vec3 u_bgColor;uniform float u_opacity;uniform float u_vignetteFrom;uniform float u_vignetteTo;uniform vec2 u_vignetteAspect;uniform vec3 u_vignetteColor;uniform float u_saturation;uniform float u_contrast;uniform float u_brightness;uniform vec3 u_tintColor;uniform float u_tintOpacity;uniform float u_ditherSeed;uniform float u_debugAlpha;float hash13(vec3 p3){p3=fract(p3*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}vec3 screen(vec3 cb,vec3 cs){return cb+cs-(cb*cs);}vec3 colorDodge(vec3 cb,vec3 cs){return mix(min(vec3(1.0),cb/(1.0-cs)),vec3(1.0),step(vec3(1.0),cs));}void main(){vec2 uv=v_uv;vec4 texel=pow(texture2D(u_texture,uv),vec4(2.2));vec3 color=texel.rgb;float luma=dot(color,vec3(0.299,0.587,0.114));color=mix(vec3(luma),color,1.0+u_saturation);color=clamp(0.5+(1.0+u_contrast)*(color-0.5),0.,1.);color+=u_brightness;color=mix(color,screen(colorDodge(color,u_tintColor),u_tintColor),u_tintOpacity);float d=length((uv-0.5)*u_vignetteAspect)*2.0;color=mix(color,u_vignetteColor,smoothstep(u_vignetteFrom,u_vignetteTo,d));gl_FragColor=vec4(mix(u_bgColor,color,u_opacity),1.0);gl_FragColor.rgb=mix(gl_FragColor.rgb,texel.aaa,u_debugAlpha);gl_FragColor.rgb=min(vec3(1.),pow(gl_FragColor.rgb,vec3(1.0/2.2))+hash13(vec3(gl_FragCoord.xy,u_ditherSeed))/255.0);}`;

export const preloaderFrag = `#define GLSLIFY 1
varying vec2 v_uv;uniform sampler2D u_texture;uniform float u_hideRatio;uniform float u_maskRatio;uniform vec2 u_resolution;uniform vec2 u_viewportResolution;
#include <getBlueNoise>
#include <sampleBlurSRGB>
void main(){vec3 bnoise=getBlueNoise(gl_FragCoord.xy);float a=u_resolution.x/u_resolution.y*0.2;float l=1.+a;float s=0.6;float x=v_uv.y+v_uv.x*a;float mask=smoothstep(0.,s,u_maskRatio*(l+s)-x)*smoothstep(s,0.,(u_maskRatio-1.)*(l+s)-x);float blurRadius=pow((1.-x/l),2.)*50.*u_viewportResolution.y/1080.*(1.-u_hideRatio);vec3 sceneColor=sampleBlurSRGB(u_texture,v_uv,1./u_resolution,blurRadius,bnoise.z).rgb;vec3 color=mix(vec3(0.0676,0.1063,0.0429),sceneColor,mask);gl_FragColor=vec4(pow(color,vec3(1.0/2.2)),1.);}`;

export const smaaEdgesVert = `#define GLSLIFY 1
attribute vec3 position;uniform vec2 u_texelSize;varying vec2 v_uv;varying vec4 v_offsets[3];void SMAAEdgeDetectionVS(vec2 texcoord){v_offsets[0]=texcoord.xyxy+u_texelSize.xyxy*vec4(-1.0,0.0,0.0,1.0);v_offsets[1]=texcoord.xyxy+u_texelSize.xyxy*vec4(1.0,0.0,0.0,-1.0);v_offsets[2]=texcoord.xyxy+u_texelSize.xyxy*vec4(-2.0,0.0,0.0,2.0);}void main(){v_uv=position.xy*0.5+0.5;SMAAEdgeDetectionVS(v_uv);gl_Position=vec4(position,1.0);}`;

export const smaaEdgesFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform vec2 u_thresholds;varying vec2 v_uv;varying vec4 v_offsets[3];vec4 SMAAColorEdgeDetectionPS(vec2 texcoord,vec4 offset[3],sampler2D colorTex){vec4 delta;vec3 C=texture2D(colorTex,texcoord).rgb;vec3 Cleft=texture2D(colorTex,offset[0].xy).rgb;vec3 t=abs(C-Cleft);delta.x=max(max(t.r,t.g),t.b);vec3 Ctop=texture2D(colorTex,offset[0].zw).rgb;t=abs(C-Ctop);delta.y=max(max(t.r,t.g),t.b);vec2 edges=step(u_thresholds,delta.xy);if(dot(edges,vec2(1.0,1.0))==0.0)discard;vec3 Cright=texture2D(colorTex,offset[1].xy).rgb;t=abs(C-Cright);delta.z=max(max(t.r,t.g),t.b);vec3 Cbottom=texture2D(colorTex,offset[1].zw).rgb;t=abs(C-Cbottom);delta.w=max(max(t.r,t.g),t.b);float maxDelta=max(max(max(delta.x,delta.y),delta.z),delta.w);vec3 Cleftleft=texture2D(colorTex,offset[2].xy).rgb;t=abs(C-Cleftleft);delta.z=max(max(t.r,t.g),t.b);vec3 Ctoptop=texture2D(colorTex,offset[2].zw).rgb;t=abs(C-Ctoptop);delta.w=max(max(t.r,t.g),t.b);maxDelta=max(max(maxDelta,delta.z),delta.w);edges.xy*=step(0.5*maxDelta,delta.xy);return vec4(edges,0.0,0.0);}void main(){gl_FragColor=SMAAColorEdgeDetectionPS(v_uv,v_offsets,u_texture);}`;

export const smaaWeightsVert = `#define GLSLIFY 1
attribute vec3 position;uniform vec2 u_texelSize;varying vec2 v_uv;varying vec4 v_offsets[3];varying vec2 v_pixcoord;void SMAABlendingWeightCalculationVS(vec2 texcoord){v_pixcoord=texcoord/u_texelSize;v_offsets[0]=texcoord.xyxy+u_texelSize.xyxy*vec4(-0.25,0.125,1.25,0.125);v_offsets[1]=texcoord.xyxy+u_texelSize.xyxy*vec4(-0.125,0.25,-0.125,-1.25);v_offsets[2]=vec4(v_offsets[0].xz,v_offsets[1].yw)+vec4(-2.0,2.0,-2.0,2.0)*u_texelSize.xxyy*float(SMAA_MAX_SEARCH_STEPS);}void main(){v_uv=position.xy*0.5+0.5;SMAABlendingWeightCalculationVS(v_uv);gl_Position=vec4(position,1.0);}`;

export const smaaWeightsFrag = `#define GLSLIFY 1
#define SMAASampleLevelZeroOffset( tex, coord, offset ) texture2D( tex, coord + float( offset ) * u_texelSize, 0.0 )
uniform sampler2D u_edgesTexture;uniform sampler2D u_areaTexture;uniform sampler2D u_searchTexture;uniform vec2 u_texelSize;varying vec2 v_uv;varying vec4 v_offsets[3];varying vec2 v_pixcoord;vec2 round(vec2 x){return sign(x)*floor(abs(x)+0.5);}float SMAASearchLength(sampler2D searchTex,vec2 e,float bias,float scale){e.r=bias+e.r*scale;return 255.0*texture2D(searchTex,e,0.0).r;}float SMAASearchXLeft(sampler2D edgesTex,sampler2D searchTex,vec2 texcoord,float end){vec2 e=vec2(0.0,1.0);for(int i=0;i<SMAA_MAX_SEARCH_STEPS;i++){e=texture2D(edgesTex,texcoord,0.0).rg;texcoord-=vec2(2.0,0.0)*u_texelSize;if(!(texcoord.x>end&&e.g>0.8281&&e.r==0.0))break;}texcoord.x+=0.25*u_texelSize.x;texcoord.x+=u_texelSize.x;texcoord.x+=2.0*u_texelSize.x;texcoord.x-=u_texelSize.x*SMAASearchLength(searchTex,e,0.0,0.5);return texcoord.x;}float SMAASearchXRight(sampler2D edgesTex,sampler2D searchTex,vec2 texcoord,float end){vec2 e=vec2(0.0,1.0);for(int i=0;i<SMAA_MAX_SEARCH_STEPS;i++){e=texture2D(edgesTex,texcoord,0.0).rg;texcoord+=vec2(2.0,0.0)*u_texelSize;if(!(texcoord.x<end&&e.g>0.8281&&e.r==0.0))break;}texcoord.x-=0.25*u_texelSize.x;texcoord.x-=u_texelSize.x;texcoord.x-=2.0*u_texelSize.x;texcoord.x+=u_texelSize.x*SMAASearchLength(searchTex,e,0.5,0.5);return texcoord.x;}float SMAASearchYUp(sampler2D edgesTex,sampler2D searchTex,vec2 texcoord,float end){vec2 e=vec2(1.0,0.0);for(int i=0;i<SMAA_MAX_SEARCH_STEPS;i++){e=texture2D(edgesTex,texcoord,0.0).rg;texcoord+=vec2(0.0,2.0)*u_texelSize;if(!(texcoord.y>end&&e.r>0.8281&&e.g==0.0))break;}texcoord.y-=0.25*u_texelSize.y;texcoord.y-=u_texelSize.y;texcoord.y-=2.0*u_texelSize.y;texcoord.y+=u_texelSize.y*SMAASearchLength(searchTex,e.gr,0.0,0.5);return texcoord.y;}float SMAASearchYDown(sampler2D edgesTex,sampler2D searchTex,vec2 texcoord,float end){vec2 e=vec2(1.0,0.0);for(int i=0;i<SMAA_MAX_SEARCH_STEPS;i++){e=texture2D(edgesTex,texcoord,0.0).rg;texcoord-=vec2(0.0,2.0)*u_texelSize;if(!(texcoord.y<end&&e.r>0.8281&&e.g==0.0))break;}texcoord.y+=0.25*u_texelSize.y;texcoord.y+=u_texelSize.y;texcoord.y+=2.0*u_texelSize.y;texcoord.y-=u_texelSize.y*SMAASearchLength(searchTex,e.gr,0.5,0.5);return texcoord.y;}vec2 SMAAArea(sampler2D areaTex,vec2 dist,float e1,float e2,float offset){vec2 texcoord=float(SMAA_AREATEX_MAX_DISTANCE)*round(4.0*vec2(e1,e2))+dist;texcoord=SMAA_AREATEX_PIXEL_SIZE*texcoord+(0.5*SMAA_AREATEX_PIXEL_SIZE);texcoord.y+=SMAA_AREATEX_SUBTEX_SIZE*offset;return texture2D(areaTex,texcoord,0.0).rg;}vec4 SMAABlendingWeightCalculationPS(vec2 texcoord,vec2 pixcoord,vec4 offset[3],sampler2D edgesTex,sampler2D areaTex,sampler2D searchTex,ivec4 subsampleIndices){vec4 weights=vec4(0.0,0.0,0.0,0.0);vec2 e=texture2D(edgesTex,texcoord).rg;if(e.g>0.0){vec2 d;vec2 coords;coords.x=SMAASearchXLeft(edgesTex,searchTex,offset[0].xy,offset[2].x);coords.y=offset[1].y;d.x=coords.x;float e1=texture2D(edgesTex,coords,0.0).r;coords.x=SMAASearchXRight(edgesTex,searchTex,offset[0].zw,offset[2].y);d.y=coords.x;d=d/u_texelSize.x-pixcoord.x;vec2 sqrt_d=sqrt(abs(d));coords.y-=1.0*u_texelSize.y;float e2=SMAASampleLevelZeroOffset(edgesTex,coords,ivec2(1,0)).r;weights.rg=SMAAArea(areaTex,sqrt_d,e1,e2,float(subsampleIndices.y));}if(e.r>0.0){vec2 d;vec2 coords;coords.y=SMAASearchYUp(edgesTex,searchTex,offset[1].xy,offset[2].z);coords.x=offset[0].x;d.x=coords.y;float e1=texture2D(edgesTex,coords,0.0).g;coords.y=SMAASearchYDown(edgesTex,searchTex,offset[1].zw,offset[2].w);d.y=coords.y;d=d/u_texelSize.y-pixcoord.y;vec2 sqrt_d=sqrt(abs(d));coords.y-=1.0*u_texelSize.y;float e2=SMAASampleLevelZeroOffset(edgesTex,coords,ivec2(0,1)).g;weights.ba=SMAAArea(areaTex,sqrt_d,e1,e2,float(subsampleIndices.x));}return weights;}void main(){gl_FragColor=SMAABlendingWeightCalculationPS(v_uv,v_pixcoord,v_offsets,u_edgesTexture,u_areaTexture,u_searchTexture,ivec4(0.0));}`;

export const smaaBlendVert = `#define GLSLIFY 1
attribute vec3 position;uniform vec2 u_texelSize;varying vec2 v_uv;varying vec4 v_offsets[2];void SMAANeighborhoodBlendingVS(vec2 texcoord){v_offsets[0]=texcoord.xyxy+u_texelSize.xyxy*vec4(-1.0,0.0,0.0,1.0);v_offsets[1]=texcoord.xyxy+u_texelSize.xyxy*vec4(1.0,0.0,0.0,-1.0);}void main(){v_uv=position.xy*0.5+0.5;SMAANeighborhoodBlendingVS(v_uv);gl_Position=vec4(position,1.0);}`;

export const smaaBlendFrag = `#define GLSLIFY 1
uniform sampler2D u_weightsTexture;uniform sampler2D u_texture;uniform vec2 u_texelSize;varying vec2 v_uv;varying vec4 v_offsets[2];vec4 SMAANeighborhoodBlendingPS(vec2 texcoord,vec4 offset[2],sampler2D colorTex,sampler2D blendTex){vec4 a;a.xz=texture2D(blendTex,texcoord).xz;a.y=texture2D(blendTex,offset[1].zw).g;a.w=texture2D(blendTex,offset[1].xy).a;if(dot(a,vec4(1.0,1.0,1.0,1.0))<1e-5){return texture2D(colorTex,texcoord,0.0);}else{vec2 offset;offset.x=a.a>a.b ? a.a :-a.b;offset.y=a.g>a.r ?-a.g : a.r;if(abs(offset.x)>abs(offset.y)){offset.y=0.0;}else{offset.x=0.0;}vec4 C=texture2D(colorTex,texcoord,0.0);texcoord+=sign(offset)*u_texelSize;vec4 Cop=texture2D(colorTex,texcoord,0.0);float s=abs(offset.x)>abs(offset.y)? abs(offset.x): abs(offset.y);C.xyz=pow(abs(C.xyz),vec3(2.2));Cop.xyz=pow(abs(Cop.xyz),vec3(2.2));vec4 mixed=mix(C,Cop,s);mixed.xyz=pow(abs(mixed.xyz),vec3(1.0/2.2));return mixed;}}void main(){gl_FragColor=SMAANeighborhoodBlendingPS(v_uv,v_offsets,u_texture,u_weightsTexture);}`;

export const appleEfxFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform float u_padding;uniform vec2 u_resolution;uniform vec2 u_coverAspect;uniform float u_time;uniform float u_amount;uniform float u_pulse;uniform vec2 u_pulseCenter;uniform sampler2D u_lmsTexture;varying vec2 v_uv;
#include <getBlueNoise>
float sdBox(in vec2 p,in vec2 b){vec2 d=abs(p)-b;return length(max(d,0.0))+min(max(d.x,d.y),0.0);}float sdCircle(vec2 p,float r){return length(p)-r;}float opSmoothUnion(float a,float b,float k){k*=4.0;float h=max(k-abs(a-b),0.0);return min(a,b)-h*h*0.25/k;}const float PI=3.14159265359;
#include <linearstep>
void main(){vec3 bnoise=getBlueNoise(gl_FragCoord.xy);vec2 aspect=vec2(u_resolution.x/u_resolution.y,1.);vec2 glowUv=(v_uv-0.5)*u_coverAspect*2.;float angle=u_time*-5.;mat2 rot=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));glowUv=rot*glowUv;glowUv=glowUv*.5+.5;glowUv=clamp(glowUv,vec2(0.),vec2(1.));vec3 c0=texture2D(u_lmsTexture,vec2(0.,.5)).rgb;vec3 c1=texture2D(u_lmsTexture,vec2(1./6.,.5)).rgb;vec3 c2=texture2D(u_lmsTexture,vec2(2./6.,.5)).rgb;vec3 c3=texture2D(u_lmsTexture,vec2(3./6.,.5)).rgb;vec3 colorT=mix(c0,c1,glowUv.x);vec3 colorB=mix(c3,c2,glowUv.x);vec3 glowColor=mix(colorB,colorT,glowUv.y);glowColor*=glowColor*glowColor*2.;vec2 wp=(v_uv-u_pulseCenter)*aspect;float wl=length(aspect);float wpl=wl-length(wp);float wsl=0.5*wl;float wel=0.5*wl;float wtl=wl+wsl+wel;float wt=u_pulse*wtl-wl+wpl;float w0=smoothstep(0.,wsl,wt);float w1=smoothstep(wsl+wel,wsl,wt);float wd=abs(wt-wsl);float wave=w0*w1*u_amount;vec2 waveDir=normalize(wp);vec2 borderUv=(v_uv-0.5)*u_resolution+waveDir*wave*0.01*u_resolution.x;float d=sdBox(borderUv,u_resolution*0.5-u_padding*2.)-u_padding;d=linearstep(0.0,u_padding*2.5,d);float test=d;d=pow(d,3.0);float d2=sdBox(borderUv,u_resolution*0.5-u_padding*3.)-u_padding*1.5;d2=linearstep(0.0,u_padding*5.5,d2);test+=d2;d2=pow(d2,5.);vec4 base=texture2D(u_texture,v_uv+waveDir*smoothstep(0.,0.4,abs(wd))*wave*-0.005);vec3 color=pow(base.rgb,vec3(2.2));float glow=(0.001+d+d2*0.5)*5.;color+=u_amount*glowColor*glow;color+=wave*(d*0.25+d2*0.25+glowColor*0.05);color=min(color,1.);glow=dot(glowColor,vec3(0.2126,0.7152,0.0722))*glow;gl_FragColor=vec4(pow(color,vec3(1.0/2.2))+bnoise*0.004,min(1.,base.a+glow+wave*(d+d2*0.5+0.05)));}`;

export const highPassFrag = `#define GLSLIFY 1
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

export const bloomBlurFrag = `#define GLSLIFY 1
varying vec2 v_uv;uniform sampler2D u_texture;uniform vec2 u_resolution;uniform vec2 u_direction;float gaussianPdf(in float x,in float sigma){return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;}void main(){vec2 invSize=1.0/u_resolution;float fSigma=float(SIGMA);float weightSum=gaussianPdf(0.0,fSigma);vec3 diffuseSum=texture2D(u_texture,v_uv).rgb*weightSum;for(int i=1;i<KERNEL_RADIUS;i++){float x=float(i);float w=gaussianPdf(x,fSigma);vec2 uvOffset=u_direction*invSize*x;vec3 sample1=texture2D(u_texture,v_uv+uvOffset).rgb;vec3 sample2=texture2D(u_texture,v_uv-uvOffset).rgb;diffuseSum+=(sample1+sample2)*w;weightSum+=2.0*w;}gl_FragColor=vec4(diffuseSum/weightSum,1.0);}`;

export const bloomCompositeFrag = `#define GLSLIFY 1
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
).rgb;float luma=dot(bloomColor,vec3(0.299,0.587,0.114));color.rgb+=mix(vec3(luma),bloomColor,u_saturation);color.rgb=dithering(color.rgb);gl_FragColor=color;}`;

export const blurBoxVert = `#define GLSLIFY 1
attribute vec3 position;attribute vec2 uv;uniform vec4 u_rect;uniform vec2 u_boxSize;varying vec2 v_xy;void main(){vec2 pos=position.xy*.5+.5;pos=mix(u_rect.xy,u_rect.xy+u_rect.zw,pos);gl_Position=vec4(pos,0.,1.);v_xy=vec2(uv.x,1.-uv.y)*u_boxSize;}`;

export const blurBoxFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform vec2 u_posA;uniform vec2 u_dir;uniform float u_length;uniform vec2 u_texelSize;uniform vec2 u_blurRadii;uniform vec3 u_color;uniform float u_colorAlphaA;uniform float u_colorAlphaB;uniform vec2 u_boxSize;uniform float u_radius;uniform float u_outline;varying vec2 v_xy;
#include <linearstep>
#include <getBlueNoise>
#include <sampleBlur>
float sdRoundedBox(in vec2 p,in vec2 b,in float r){vec2 q=abs(p)-b+r;return min(max(q.x,q.y),0.0)+length(max(q,0.0))-r;}void main(){vec3 bnoise=getBlueNoise(gl_FragCoord.xy);vec2 uv=gl_FragCoord.xy*u_texelSize;float ratio=clamp(dot(v_xy-u_posA.xy,u_dir)/u_length,0.,1.);float sdf=sdRoundedBox(v_xy-u_boxSize.xy*0.5,u_boxSize*.5,u_radius);float roundedBox=smoothstep(1.5,0.,sdf);float blurRadius=mix(u_blurRadii.x,u_blurRadii.y,ratio)*roundedBox;vec4 color=sampleBlur(u_texture,uv,u_texelSize,blurRadius,bnoise.z);float colorAlpha=mix(u_colorAlphaA,u_colorAlphaB,ratio)*roundedBox;color.rgb=mix(color.rgb,u_color,colorAlpha);float outline=smoothstep(-1.5,0.,sdf)*roundedBox;vec2 boxUv=v_xy/u_boxSize;color.rgb+=outline*linearstep(0.,2.,2.-boxUv.x-boxUv.y)*max(u_colorAlphaA,u_colorAlphaB)*u_outline;gl_FragColor=color;}`;

export const screenPaintFrag = `#define GLSLIFY 1
uniform sampler2D u_lowPaintTexture;uniform sampler2D u_prevPaintTexture;uniform vec2 u_paintTexelSize;uniform vec4 u_drawFrom;uniform vec4 u_drawTo;uniform float u_pushStrength;uniform vec3 u_dissipations;uniform vec2 u_vel;varying vec2 v_uv;vec2 sdSegment(in vec2 p,in vec2 a,in vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);return vec2(length(pa-ba*h),h);}
#ifdef USE_NOISE
uniform float u_curlScale;uniform float u_curlStrength;vec2 hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy)*2.0-1.0;}vec3 noised(in vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);vec2 du=30.0*f*f*(f*(f-2.0)+1.0);vec2 ga=hash(i+vec2(0.0,0.0));vec2 gb=hash(i+vec2(1.0,0.0));vec2 gc=hash(i+vec2(0.0,1.0));vec2 gd=hash(i+vec2(1.0,1.0));float va=dot(ga,f-vec2(0.0,0.0));float vb=dot(gb,f-vec2(1.0,0.0));float vc=dot(gc,f-vec2(0.0,1.0));float vd=dot(gd,f-vec2(1.0,1.0));return vec3(va+u.x*(vb-va)+u.y*(vc-va)+u.x*u.y*(va-vb-vc+vd),ga+u.x*(gb-ga)+u.y*(gc-ga)+u.x*u.y*(ga-gb-gc+gd)+du*(u.yx*(va-vb-vc+vd)+vec2(vb,vc)-va));}
#endif
void main(){vec2 res=sdSegment(gl_FragCoord.xy,u_drawFrom.xy,u_drawTo.xy);vec2 radiusWeight=mix(u_drawFrom.zw,u_drawTo.zw,res.y);float d=1.0-smoothstep(-0.01,radiusWeight.x,res.x);vec4 lowData=texture2D(u_lowPaintTexture,v_uv);vec2 velInv=(0.5-lowData.xy)*u_pushStrength;
#ifdef USE_NOISE
vec3 noise3=noised(gl_FragCoord.xy*u_curlScale*(1.0-lowData.xy));vec2 noise=noised(gl_FragCoord.xy*u_curlScale*(2.0-lowData.xy*(0.5+noise3.x)+noise3.yz*0.1)).yz;velInv+=noise*(lowData.z+lowData.w)*u_curlStrength;
#endif
vec4 data=texture2D(u_prevPaintTexture,v_uv+velInv*u_paintTexelSize);data.xy-=0.5;vec4 delta=(u_dissipations.xxyz-1.0)*data;vec2 newVel=u_vel*d;delta+=vec4(newVel,radiusWeight.yy*d);delta.zw=sign(delta.zw)*max(vec2(0.004),abs(delta.zw));data+=delta;data.xy+=0.5;gl_FragColor=clamp(data,vec4(0.0),vec4(1.0));}`;

export const screenPaintDistortionFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform sampler2D u_screenPaintTexture;uniform vec2 u_screenPaintTexelSize;uniform float u_amount;uniform float u_rgbShift;uniform float u_multiplier;uniform float u_colorMultiplier;uniform float u_shade;varying vec2 v_uv;
#include <getBlueNoise>
void main(){vec3 bnoise=getBlueNoise(gl_FragCoord.xy+vec2(17.,29.));vec4 data=texture2D(u_screenPaintTexture,v_uv);float weight=(data.z+data.w)*0.5;vec2 vel=(0.5-data.xy-0.001)*2.*weight;vec4 color=vec4(0.0);vec2 velocity=vel*u_amount/4.0*u_screenPaintTexelSize*u_multiplier;vec2 uv=v_uv+bnoise.xy*velocity;for(int i=0;i<9;i++){color+=texture2D(u_texture,uv);uv+=velocity;}color/=9.;color.rgb+=sin(vec3(vel.x+vel.y)*40.0+vec3(0.0,2.0,4.0)*u_rgbShift)*smoothstep(0.4,-0.9,weight)*u_shade*max(abs(vel.x),abs(vel.y))*u_colorMultiplier;gl_FragColor=color;}`;

export const bokehCocFrag = `#define GLSLIFY 1
uniform sampler2D u_texture;uniform sampler2D u_depthTexture;uniform vec2 u_texelSize;uniform float u_focusDistance;uniform float u_lensCoeff;uniform float u_maxCoC;uniform float u_rcpMaxCoC;uniform float u_cameraNear;uniform float u_cameraFar;varying vec2 v_uv;float max3(vec3 xyz){return max(xyz.x,max(xyz.y,xyz.z));}
#ifndef USE_FLOAT
uniform float u_hashNoise;float hash13(vec3 p3){p3=fract(p3*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
#endif
float getViewZ(vec2 uv){float depth=texture2D(u_depthTexture,uv).r*2.0-1.0;return 2.0*u_cameraNear*u_cameraFar/(u_cameraFar+u_cameraNear-depth*(u_cameraFar-u_cameraNear));}void main(){vec3 duv=u_texelSize.xyx*vec3(0.5,0.5,-0.5);vec3 c0=texture2D(u_texture,v_uv-duv.xy).rgb;vec3 c1=texture2D(u_texture,v_uv-duv.zy).rgb;vec3 c2=texture2D(u_texture,v_uv+duv.zy).rgb;vec3 c3=texture2D(u_texture,v_uv+duv.xy).rgb;vec2 uvAlt=v_uv;float d0=getViewZ(uvAlt-duv.xy);float d1=getViewZ(uvAlt-duv.zy);float d2=getViewZ(uvAlt+duv.zy);float d3=getViewZ(uvAlt+duv.xy);vec4 depths=vec4(d0,d1,d2,d3);float focusDistance=u_focusDistance;vec4 cocs=(depths-focusDistance)*u_lensCoeff/depths;cocs=clamp(cocs,-u_maxCoC,u_maxCoC);vec4 weights=clamp(abs(cocs)*u_rcpMaxCoC,vec4(0.0),vec4(1.0));weights.x*=1.0/(max3(c0)+1.0);weights.y*=1.0/(max3(c1)+1.0);weights.z*=1.0/(max3(c2)+1.0);weights.w*=1.0/(max3(c3)+1.0);vec3 avg=c0*weights.x+c1*weights.y+c2*weights.z+c3*weights.w;avg/=dot(weights,vec4(1.0));float coc=dot(cocs,vec4(0.25));avg*=smoothstep(0.0,u_texelSize.y*2.0,abs(coc));gl_FragColor=vec4(avg,coc);
#ifndef USE_FLOAT
gl_FragColor=sign(gl_FragColor)*sqrt(abs(gl_FragColor));gl_FragColor=gl_FragColor*0.5+0.5+hash13(vec3(gl_FragCoord.xy,u_hashNoise))/255.0;
#endif
}`;

export const bokehSimFrag = `#define GLSLIFY 1
#if QUALITY == 0
const int kSampleCount=16;vec2 kDiskKernel[kSampleCount];void initKernel(){kDiskKernel[0]=vec2(0.0,0.0);kDiskKernel[1]=vec2(0.54545456,0.0);kDiskKernel[2]=vec2(0.16855472,0.5187581);kDiskKernel[3]=vec2(-0.44128203,0.3206101);kDiskKernel[4]=vec2(-0.44128197,-0.3206102);kDiskKernel[5]=vec2(0.1685548,-0.5187581);kDiskKernel[6]=vec2(1.0,0.0);kDiskKernel[7]=vec2(0.809017,0.58778524);kDiskKernel[8]=vec2(0.30901697,0.95105654);kDiskKernel[9]=vec2(-0.30901703,0.9510565);kDiskKernel[10]=vec2(-0.80901706,0.5877852);kDiskKernel[11]=vec2(-1.0,0.0);kDiskKernel[12]=vec2(-0.80901694,-0.58778536);kDiskKernel[13]=vec2(-0.30901664,-0.9510566);kDiskKernel[14]=vec2(0.30901712,-0.9510565);kDiskKernel[15]=vec2(0.80901694,-0.5877853);}
#endif
#if QUALITY == 1
const int kSampleCount=22;vec2 kDiskKernel[kSampleCount];void initKernel(){kDiskKernel[0]=vec2(0.0,0.0);kDiskKernel[1]=vec2(0.53333336,0.0);kDiskKernel[2]=vec2(0.3325279,0.4169768);kDiskKernel[3]=vec2(-0.11867785,0.5199616);kDiskKernel[4]=vec2(-0.48051673,0.2314047);kDiskKernel[5]=vec2(-0.48051673,-0.23140468);kDiskKernel[6]=vec2(-0.11867763,-0.51996166);kDiskKernel[7]=vec2(0.33252785,-0.4169769);kDiskKernel[8]=vec2(1.0,0.0);kDiskKernel[9]=vec2(0.90096885,0.43388376);kDiskKernel[10]=vec2(0.6234898,0.7818315);kDiskKernel[11]=vec2(0.22252098,0.9749279);kDiskKernel[12]=vec2(-0.22252095,0.9749279);kDiskKernel[13]=vec2(-0.62349,0.7818314);kDiskKernel[14]=vec2(-0.90096885,0.43388382);kDiskKernel[15]=vec2(-1.0,0.0);kDiskKernel[16]=vec2(-0.90096885,-0.43388376);kDiskKernel[17]=vec2(-0.6234896,-0.7818316);kDiskKernel[18]=vec2(-0.22252055,-0.974928);kDiskKernel[19]=vec2(0.2225215,-0.9749278);kDiskKernel[20]=vec2(0.6234897,-0.7818316);kDiskKernel[21]=vec2(0.90096885,-0.43388376);}
#endif
#if QUALITY == 2
const int kSampleCount=43;vec2 kDiskKernel[kSampleCount];void initKernel(){kDiskKernel[0]=vec2(0.0,0.0);kDiskKernel[1]=vec2(0.36363637,0.0);kDiskKernel[2]=vec2(0.22672357,0.28430238);kDiskKernel[3]=vec2(-0.08091671,0.35451925);kDiskKernel[4]=vec2(-0.32762504,0.15777594);kDiskKernel[5]=vec2(-0.32762504,-0.15777591);kDiskKernel[6]=vec2(-0.08091656,-0.35451928);kDiskKernel[7]=vec2(0.22672352,-0.2843024);kDiskKernel[8]=vec2(0.6818182,0.0);kDiskKernel[9]=vec2(0.614297,0.29582983);kDiskKernel[10]=vec2(0.42510667,0.5330669);kDiskKernel[11]=vec2(0.15171885,0.6647236);kDiskKernel[12]=vec2(-0.15171883,0.6647236);kDiskKernel[13]=vec2(-0.4251068,0.53306687);kDiskKernel[14]=vec2(-0.614297,0.29582986);kDiskKernel[15]=vec2(-0.6818182,0);kDiskKernel[16]=vec2(-0.614297,-0.29582983);kDiskKernel[17]=vec2(-0.42510656,-0.53306705);kDiskKernel[18]=vec2(-0.15171856,-0.66472363);kDiskKernel[19]=vec2(0.1517192,-0.6647235);kDiskKernel[20]=vec2(0.4251066,-0.53306705);kDiskKernel[21]=vec2(0.614297,-0.29582983);kDiskKernel[22]=vec2(1.0,0.0);kDiskKernel[23]=vec2(0.9555728,0.2947552);kDiskKernel[24]=vec2(0.82623875,0.5633201);kDiskKernel[25]=vec2(0.6234898,0.7818315);kDiskKernel[26]=vec2(0.36534098,0.93087375);kDiskKernel[27]=vec2(0.07473,0.9972038);kDiskKernel[28]=vec2(-0.22252095,0.9749279);kDiskKernel[29]=vec2(-0.50000006,0.8660254);kDiskKernel[30]=vec2(-0.73305196,0.6801727);kDiskKernel[31]=vec2(-0.90096885,0.43388382);kDiskKernel[32]=vec2(-0.98883086,0.14904208);kDiskKernel[33]=vec2(-0.9888308,-0.14904249);kDiskKernel[34]=vec2(-0.90096885,-0.43388376);kDiskKernel[35]=vec2(-0.73305184,-0.6801728);kDiskKernel[36]=vec2(-0.4999999,-0.86602545);kDiskKernel[37]=vec2(-0.222521,-0.9749279);kDiskKernel[38]=vec2(0.07473029,-0.99720377);kDiskKernel[39]=vec2(0.36534148,-0.9308736);kDiskKernel[40]=vec2(0.6234897,-0.7818316);kDiskKernel[41]=vec2(0.8262388,-0.56332);kDiskKernel[42]=vec2(0.9555729,-0.29475483);}
#endif
#if QUALITY == 3
const int kSampleCount=71;vec2 kDiskKernel[kSampleCount];void initKernel(){kDiskKernel[0]=vec2(0,0);kDiskKernel[1]=vec2(0.2758621,0.0);kDiskKernel[2]=vec2(0.1719972,0.21567768);kDiskKernel[3]=vec2(-0.061385095,0.26894566);kDiskKernel[4]=vec2(-0.24854316,0.1196921);kDiskKernel[5]=vec2(-0.24854316,-0.11969208);kDiskKernel[6]=vec2(-0.061384983,-0.2689457);kDiskKernel[7]=vec2(0.17199717,-0.21567771);kDiskKernel[8]=vec2(0.51724136,0.0);kDiskKernel[9]=vec2(0.46601835,0.22442262);kDiskKernel[10]=vec2(0.32249472,0.40439558);kDiskKernel[11]=vec2(0.11509705,0.50427306);kDiskKernel[12]=vec2(-0.11509704,0.50427306);kDiskKernel[13]=vec2(-0.3224948,0.40439552);kDiskKernel[14]=vec2(-0.46601835,0.22442265);kDiskKernel[15]=vec2(-0.51724136,0.0);kDiskKernel[16]=vec2(-0.46601835,-0.22442262);kDiskKernel[17]=vec2(-0.32249463,-0.40439564);kDiskKernel[18]=vec2(-0.11509683,-0.5042731);kDiskKernel[19]=vec2(0.11509732,-0.504273);kDiskKernel[20]=vec2(0.32249466,-0.40439564);kDiskKernel[21]=vec2(0.46601835,-0.22442262);kDiskKernel[22]=vec2(0.7586207,0.0);kDiskKernel[23]=vec2(0.7249173,0.22360738);kDiskKernel[24]=vec2(0.6268018,0.4273463);kDiskKernel[25]=vec2(0.47299224,0.59311354);kDiskKernel[26]=vec2(0.27715522,0.7061801);kDiskKernel[27]=vec2(0.056691725,0.75649947);kDiskKernel[28]=vec2(-0.168809,0.7396005);kDiskKernel[29]=vec2(-0.3793104,0.65698475);kDiskKernel[30]=vec2(-0.55610836,0.51599306);kDiskKernel[31]=vec2(-0.6834936,0.32915324);kDiskKernel[32]=vec2(-0.7501475,0.113066405);kDiskKernel[33]=vec2(-0.7501475,-0.11306671);kDiskKernel[34]=vec2(-0.6834936,-0.32915318);kDiskKernel[35]=vec2(-0.5561083,-0.5159932);kDiskKernel[36]=vec2(-0.37931028,-0.6569848);kDiskKernel[37]=vec2(-0.16880904,-0.7396005);kDiskKernel[38]=vec2(0.056691945,-0.7564994);kDiskKernel[39]=vec2(0.2771556,-0.7061799);kDiskKernel[40]=vec2(0.47299215,-0.59311366);kDiskKernel[41]=vec2(0.62680185,-0.4273462);kDiskKernel[42]=vec2(0.72491735,-0.22360711);kDiskKernel[43]=vec2(1.0,0.0);kDiskKernel[44]=vec2(0.9749279,0.22252093);kDiskKernel[45]=vec2(0.90096885,0.43388376);kDiskKernel[46]=vec2(0.7818315,0.6234898);kDiskKernel[47]=vec2(0.6234898,0.7818315);kDiskKernel[48]=vec2(0.43388364,0.9009689);kDiskKernel[49]=vec2(0.22252098,0.9749279);kDiskKernel[50]=vec2(0.0,1.0);kDiskKernel[51]=vec2(-0.22252095,0.9749279);kDiskKernel[52]=vec2(-0.43388385,0.90096885);kDiskKernel[53]=vec2(-0.62349,0.7818314);kDiskKernel[54]=vec2(-0.7818317,0.62348956);kDiskKernel[55]=vec2(-0.90096885,0.43388382);kDiskKernel[56]=vec2(-0.9749279,0.22252093);kDiskKernel[57]=vec2(-1.0,0.0);kDiskKernel[58]=vec2(-0.9749279,-0.22252087);kDiskKernel[59]=vec2(-0.90096885,-0.43388376);kDiskKernel[60]=vec2(-0.7818314,-0.6234899);kDiskKernel[61]=vec2(-0.6234896,-0.7818316);kDiskKernel[62]=vec2(-0.43388346,-0.900969);kDiskKernel[63]=vec2(-0.22252055,-0.974928);kDiskKernel[64]=vec2(0.0,-1.0);kDiskKernel[65]=vec2(0.2225215,-0.9749278);kDiskKernel[66]=vec2(0.4338835,-0.90096897);kDiskKernel[67]=vec2(0.6234897,-0.7818316);kDiskKernel[68]=vec2(0.78183144,-0.62348986);kDiskKernel[69]=vec2(0.90096885,-0.43388376);kDiskKernel[70]=vec2(0.9749279,-0.22252086);}
#endif
uniform sampler2D u_cocTexture;uniform vec2 u_cocTexelSize;uniform float u_rcpAspect;uniform float u_maxCoC;varying vec2 v_uv;void main(){initKernel();vec4 samp0=texture2D(u_cocTexture,v_uv);
#ifndef USE_FLOAT
samp0=samp0*2.0-1.0;samp0=sign(samp0)*samp0*samp0;
#endif
vec4 bgAcc=vec4(0.0);vec4 fgAcc=vec4(0.0);for(int si=0;si<kSampleCount;si++){vec2 disp=kDiskKernel[si]*u_maxCoC;float dist=length(disp);vec2 duv=vec2(disp.x*u_rcpAspect,disp.y);vec4 samp=texture2D(u_cocTexture,v_uv+duv);
#ifndef USE_FLOAT
samp=samp*2.0-1.0;samp=sign(samp)*samp*samp;
#endif
float bgCoC=max(min(samp0.a,samp.a),0.0);float margin=u_cocTexelSize.y*2.0;float bgWeight=clamp((bgCoC-dist+margin)/margin,0.0,1.0);float fgWeight=clamp((-samp.a-dist+margin)/margin,0.0,1.0);fgWeight*=step(u_cocTexelSize.y,-samp.a);bgAcc+=vec4(samp.rgb,1.0)*bgWeight;fgAcc+=vec4(samp.rgb,1.0)*fgWeight;}bgAcc.rgb/=bgAcc.a+step(bgAcc.a,0.0);fgAcc.rgb/=fgAcc.a+step(fgAcc.a,0.0);bgAcc.a=smoothstep(u_cocTexelSize.y,u_cocTexelSize.y*2.0,samp0.a);fgAcc.a*=3.14159265359/float(kSampleCount);vec3 rgb=vec3(0.0);rgb=mix(rgb,bgAcc.rgb,clamp(bgAcc.a,0.0,1.0));rgb=mix(rgb,fgAcc.rgb,clamp(fgAcc.a,0.0,1.0));float alpha=(1.0-clamp(bgAcc.a,0.0,1.0))*(1.0-clamp(fgAcc.a,0.0,1.0));gl_FragColor=vec4(rgb,alpha);}`;

export const bokehBlurFrag = `#define GLSLIFY 1
uniform sampler2D u_bokehTexture;uniform vec2 u_bokehTexelSize;varying vec2 v_uv;void main(){vec4 duv=u_bokehTexelSize.xyxy*vec4(1.0,1.0,-1.0,0.0);vec4 acc;acc=texture2D(u_bokehTexture,v_uv-duv.xy);acc+=texture2D(u_bokehTexture,v_uv-duv.wy)*2.0;acc+=texture2D(u_bokehTexture,v_uv-duv.zy);acc+=texture2D(u_bokehTexture,v_uv+duv.zw)*2.0;acc+=texture2D(u_bokehTexture,v_uv)*4.0;acc+=texture2D(u_bokehTexture,v_uv+duv.xw)*2.0;acc+=texture2D(u_bokehTexture,v_uv+duv.zy);acc+=texture2D(u_bokehTexture,v_uv+duv.wy)*2.0;acc+=texture2D(u_bokehTexture,v_uv+duv.xy);gl_FragColor=acc*0.0625;}`;

export const bokehCompositeFrag = `#define GLSLIFY 1
varying vec2 v_uv;uniform sampler2D u_texture;uniform sampler2D u_blurTexture;uniform float u_amount;void main(){vec4 cs=texture2D(u_texture,v_uv);vec4 cb=texture2D(u_blurTexture,v_uv);vec3 rgb=cs.rgb*cb.a+cb.rgb;gl_FragColor=mix(cs,vec4(rgb,cs.a),u_amount);}`;
