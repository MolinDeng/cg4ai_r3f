precision highp float;

varying vec2 vUv;

uniform vec2 u_resolution;// Width & height of the shader
uniform float u_time;// Time elapsed

// Constants
#define PI 3.1415925359
#define MAX_STEPS 100// Mar Raymarching steps
#define MAX_DIST 100.// Max Raymarching distance
#define SURF_DIST.01// Surface Distance

mat2 Rotate(float a)
{
  float s = sin(a), c = cos(a);
  return mat2(c, -s, s, c);
}

///////////////////////
// Primitives
///////////////////////

// Round Box - exact
float roundBoxSDF(vec3 p, vec3 b, float r)
{
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

// Triangular Prism - exact
float triPrismSDF(vec3 p, vec2 h)
{
  const float k = sqrt(3.0);
  h.x *= 0.5 * k;
  p.xy /= h.x;
  p.x = abs(p.x) - 1.0;
  p.y = p.y + 1.0 / k;
  if(p.x + k * p.y > 0.0)
    p.xy = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0, 0.0);
  float d1 = length(p.xy) * sign(-p.y) * h.x;
  float d2 = abs(p.z) - h.y;
  return length(max(vec2(d1, d2), 0.0)) + min(max(d1, d2), 0.);
}

// Rounded Cylinder - exact
float roundedCylinderSDF(vec3 p, float ra, float rb, float h)
{
  vec2 d = vec2(length(p.xz) - 2.0 * ra + rb, abs(p.y) - h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rb;
}

///////////////////////
// Boolean Operators
///////////////////////

float intersectSDF(float distA, float distB)
{
  return max(distA, distB);
}

float unionSDF(float distA, float distB)
{
  return min(distA, distB);
}

float differenceSDF(float distA, float distB)
{
  return max(distA, -distB);
}

/////////////////////////////
// Smooth blending operators
/////////////////////////////

float smoothIntersectSDF(float distA, float distB, float k)
{
  float h = clamp(0.5 - 0.5 * (distA - distB) / k, 0., 1.);
  return mix(distA, distB, h) + k * h * (1. - h);
}

float smoothUnionSDF(float distA, float distB, float k)
{
  float h = clamp(0.5 + 0.5 * (distA - distB) / k, 0., 1.);
  return mix(distA, distB, h) - k * h * (1. - h);
}

float smoothDifferenceSDF(float distA, float distB, float k)
{
  float h = clamp(0.5 - 0.5 * (distA + distB) / k, 0., 1.);
  return mix(distA, -distB, h) + k * h * (1. - h);
}
/////////////////////////

float GetDist(vec3 p)
{

  float d = 0.;

    // Circle
  vec3 tPos = vec3(-1, 1, 6);
  tPos = p - tPos;
  tPos.xz *= Rotate(-u_time);
  tPos.xy *= Rotate(-u_time);
  d = roundedCylinderSDF(tPos, .4, .05, .1);
  d = smoothDifferenceSDF(d, roundedCylinderSDF(tPos, .3, .2, .2), .05);

    // Triangle
  vec3 tr0Pos = p - vec3(-3, 1, 6);
  tr0Pos.xy *= Rotate(-u_time);
  tr0Pos.xz *= Rotate(-u_time);
  d = min(d, triPrismSDF(tr0Pos, vec2(1., .1)) - .05); // Subtracts -.05 from the distance in the end to give the triangle round edges 
  d = smoothDifferenceSDF(d, triPrismSDF(tr0Pos, vec2(.7, .1 + SURF_DIST * 5.)), .05);

    // Cross
  vec3 cPos = p - vec3(1, 1, 6);
  cPos.xy *= Rotate(u_time);
  cPos.xz *= Rotate(u_time);
  d = min(d, roundBoxSDF(cPos, vec3(.8, .1, .1), .05));
  d = unionSDF(d, roundBoxSDF(cPos, vec3(.1, .8, .1), .05));

    // Square
  vec3 sq0Pos = p - vec3(3, 1, 6);
  sq0Pos.xy *= Rotate(u_time);
  sq0Pos.xz *= Rotate(u_time);
  d = min(d, roundBoxSDF(sq0Pos, vec3(.7, .7, .1), .05));
  d = smoothDifferenceSDF(d, roundBoxSDF(sq0Pos, vec3(.6, .6, .2), -.05), .05);

    // Plane
  float planeDist = p.y;
  d = smoothUnionSDF(d, planeDist, smoothstep(1., 0., p.y));

  return d;
}

float RayMarch(vec3 ro, vec3 rd)
{
  float dO = 0.;//Distane Origin
  for(int i = 0; i < MAX_STEPS; i++)
  {
    vec3 p = ro + rd * dO;
    float ds = GetDist(p);// ds is Distance Scene
    dO += ds;
    if(dO > MAX_DIST || ds < SURF_DIST)
      break;
  }
  return dO;
}

vec3 GetNormal(vec3 p)
{
  float d = GetDist(p);// Distance
  vec2 e = vec2(.01, 0);// Epsilon

  vec3 n = d - vec3(GetDist(p - e.xyy),// e.xyy is the same as vec3(.01,0,0). The x of e is .01. this is called a swizzle
  GetDist(p - e.yxy), GetDist(p - e.yyx));

  return normalize(n);
}

float SoftShadow(in vec3 ro, in vec3 rd, float mint, float maxt, float k)
{
  float res = 1.0;
  float t = mint;
  for(int i = 0; i < 256 && t < maxt; i++)
  {
    float h = GetDist(ro + rd * t);
    if(h < 0.001)
      return 0.0;
    res = min(res, k * h / t);
    t += h;
  }
  return res;
}

float GetLight(vec3 p)
{
    // Directional light
  vec3 lightPos = vec3(5. * sin(u_time), 5., 6. + 5. * cos(u_time));// Light Position

  vec3 l = normalize(lightPos - p);// Light Vector
  vec3 n = GetNormal(p);// Normal Vector

  float dif = dot(n, l);
  dif = clamp(dif, 0., 1.);

  // Hard Shadows
  // float d = RayMarch(p + n * SURF_DIST * 2., l);
  // if(d < length(lightPos - p))
  //   dif *= .1;

  // Soft Shadows
  float shadows = SoftShadow(p, l, 0.1, 5.0, 16.0);
  dif *= shadows;

  return dif;
}

void main()
{
  vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / u_resolution.y;

  vec3 ro = vec3(0, 1, 0);// Ray Origin/Camera
  vec3 rd = normalize(vec3(uv.x, uv.y, 1));// Ray Direction

  float d = RayMarch(ro, rd);// Distance

  vec3 p = ro + rd * d;
  float dif = GetLight(p);// Diffuse lighting

  vec3 color = vec3(dif);

    // Set the output color
  gl_FragColor = vec4(color, 1.);
}
