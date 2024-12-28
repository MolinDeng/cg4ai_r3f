precision highp float;

varying vec2 vUv;

uniform vec2 u_resolution;// Width & height of the shader
uniform float u_time;// Time elapsed

// Signed distance function for a hexagon
float sdHexagon(vec2 p, float s, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269); // Constants for hexagon geometry
    p = abs(p); // Reflect to the first quadrant
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy; // Project onto hexagon bounds
    p -= vec2(clamp(p.x, -k.z * s, k.z * s), s); // Clamp to hexagon's limits
    return length(p) * sign(p.y) - r; // Distance with corner radius
}

void main() {
    // Normalized pixel coordinates
    vec2 p = (2.0 * gl_FragCoord.xy - u_resolution) / u_resolution.y;
    // Size
    float si = 0.3 + 0.2 * cos(u_time);
    // Corner radius
    float ra = 0.3 * si;

    // Compute signed distance
    float d = sdHexagon(p, si, ra);

    // Coloring
    vec3 col = (d > 0.0) ? vec3(0.9, 0.6, 0.3) : vec3(0.5, 0.85, 1.0);
    col *= 1.0 - exp(-7.0 * abs(d));
    col *= 0.8 + 0.2 * cos(128.0 * d);
    col = mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.01, abs(d)));

    // Output color
    gl_FragColor = vec4(col, 1.0);
}