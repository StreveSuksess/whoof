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
