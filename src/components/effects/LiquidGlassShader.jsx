
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const LiquidGlassShader = forwardRef(({ imageUrl, style = {}, performanceMode = true, panels = [] }, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Refs to store state without re-renders
  const stateRef = useRef({
    gl: null,
    program: null,
    uniforms: {},
    texture: null,
    mouse: [0, 0],
    isRendering: false,
    width: 0,
    height: 0,
    dpr: 1,
    panels: [] // Store current panels to avoid prop drilling in loop
  });

  // Sync panels to ref for the render loop
  useEffect(() => {
    stateRef.current.panels = panels;
    if (stateRef.current.renderFn) stateRef.current.renderFn();
  }, [panels]);

  // Expose render function for manual triggers
  useImperativeHandle(ref, () => ({
    render: () => stateRef.current.renderFn && stateRef.current.renderFn()
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { powerPreference: 'low-power', alpha: true });
    if (!gl) return;

    stateRef.current.gl = gl;

    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;

      uniform vec3 iResolution;
      uniform float iTime;
      uniform vec4 iMouse;
      uniform sampler2D iChannel0;
      
      // Panel data: x, y, width, height. Normalized 0-1.
      uniform vec4 uPanels[15]; 
      uniform float uPanelActive[15];

      float getLiquidBox(vec2 uv, vec4 panel, float aspect) {
          // panel.xy is center, panel.zw is half-width/half-height
          vec2 m = (uv - panel.xy);
          return pow(abs(m.x * aspect / panel.z), 6.0) + pow(abs(m.y / panel.w), 6.0);
      }

      void mainImage(out vec4 fragColor, in vec2 fragCoord)
      {
        const float NUM_ZERO = 0.0;
        const float NUM_ONE = 1.0;
        const float NUM_HALF = 0.5;
        const float NUM_TWO = 2.0;
        const float LENS_MULTIPLIER = 5000.0;
        const float LIGHTING_INTENSITY = 0.3;
        const float SAMPLE_RANGE = 4.0;
        const float SAMPLE_OFFSET = 0.5;

        vec2 uv = fragCoord / iResolution.xy;
        float aspect = iResolution.x / iResolution.y;
        
        // Combine all active panels using smooth min
        float minBox = 1000.0;
        vec2 closestCenter = vec2(0.5);
        bool anyActive = false;

        for(int i = 0; i < 15; i++) {
            if (uPanelActive[i] > 0.5) {
                float box = getLiquidBox(uv, uPanels[i], aspect);
                if (box < minBox) {
                    minBox = box;
                    closestCenter = uPanels[i].xy;
                }
                anyActive = true;
            }
        }

        // Add mouse interactive box as a bonus panel
        vec2 mouse = iMouse.xy;
        if (length(mouse) > 1.0) {
            float mBox = getLiquidBox(uv, vec4(mouse / iResolution.xy, 0.15, 0.15), aspect);
            if (mBox < minBox) {
                minBox = mBox;
                closestCenter = mouse / iResolution.xy;
            }
            anyActive = true;
        }

        if (!anyActive) {
            fragColor = texture2D(iChannel0, uv);
            return;
        }

        float roundedBox = minBox;
        
        // Thresholds
        float rb1 = clamp((NUM_ONE - roundedBox * 8000.0) * 8.0, NUM_ZERO, NUM_ONE);
        float rb2 = clamp((0.95 - roundedBox * 7500.0) * 16.0, NUM_ZERO, NUM_ONE) -
                   clamp(pow(0.9 - roundedBox * 7500.0, NUM_ONE) * 16.0, NUM_ZERO, NUM_ONE);
        float rb3 = clamp((1.5 - roundedBox * 9000.0) * 2.0, NUM_ZERO, NUM_ONE) -
                   clamp(pow(NUM_ONE - roundedBox * 9000.0, NUM_ONE) * 2.0, NUM_ZERO, NUM_ONE);

        float transition = smoothstep(NUM_ZERO, NUM_ONE, rb1 + rb2);

        if (transition > NUM_ZERO) {
          vec2 lens = ((uv - NUM_HALF) * NUM_ONE * (NUM_ONE - roundedBox * LENS_MULTIPLIER) + NUM_HALF);
          
          vec4 texColor = vec4(0.0);
          float total = 0.0;
          for (float x = -SAMPLE_RANGE; x <= SAMPLE_RANGE; x++) {
            for (float y = -SAMPLE_RANGE; y <= SAMPLE_RANGE; y++) {
              vec2 offset = vec2(x, y) * SAMPLE_OFFSET / iResolution.xy;
              texColor += texture2D(iChannel0, offset + lens);
              total += 1.0;
            }
          }
          texColor /= total;

          vec2 localM = uv - closestCenter;
          float gradient = clamp((clamp(localM.y, 0.0, 0.2) + 0.1) / 2.0, 0.0, 1.0) +
                           clamp((clamp(-localM.y, -1000.0, 0.2) * rb3 + 0.1) / 2.0, 0.0, 1.0);
          
          vec4 lighting = clamp(texColor + vec4(rb1) * gradient + vec4(rb2) * LIGHTING_INTENSITY, 0.0, 1.0);
          fragColor = mix(texture2D(iChannel0, uv), lighting, transition);
        } else {
          fragColor = texture2D(iChannel0, uv);
        }
      }

      void main() {
        mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

    const createShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);
    stateRef.current.program = program;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    stateRef.current.uniforms = {
      resolution: gl.getUniformLocation(program, 'iResolution'),
      time: gl.getUniformLocation(program, 'iTime'),
      mouse: gl.getUniformLocation(program, 'iMouse'),
      texture: gl.getUniformLocation(program, 'iChannel0'),
      panels: gl.getUniformLocation(program, 'uPanels'),
      panelActive: gl.getUniformLocation(program, 'uPanelActive')
    };

    const texture = gl.createTexture();
    stateRef.current.texture = texture;

    const renderFrame = () => {
      const { gl, program, uniforms, texture, mouse, width, height, panels } = stateRef.current;
      if (!gl || !program) return;

      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform3f(uniforms.resolution, width, height, 1.0);
      gl.uniform1f(uniforms.time, performance.now() / 1000);
      gl.uniform4f(uniforms.mouse, mouse[0], mouse[1], 0, 0);

      // Pass panels to shader
      const panelData = new Float32Array(15 * 4);
      const activeData = new Float32Array(15);

      panels.slice(0, 15).forEach((p, i) => {
        panelData[i * 4 + 0] = p.x;
        panelData[i * 4 + 1] = p.y;
        panelData[i * 4 + 2] = p.w;
        panelData[i * 4 + 3] = p.h;
        activeData[i] = 1.0;
      });

      gl.uniform4fv(uniforms.panels, panelData);
      gl.uniform1fv(uniforms.panelActive, activeData);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.texture, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    stateRef.current.renderFn = renderFrame;

    const updateMouse = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = stateRef.current.dpr;
      const x = (clientX - rect.left) * dpr;
      const y = (rect.height - (clientY - rect.top)) * dpr;
      stateRef.current.mouse = [x, y];
      requestAnimationFrame(renderFrame);
    };

    const handleMouseMove = (e) => updateMouse(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      updateMouse(touch.clientX, touch.clientY);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const displayWidth = containerRef.current.clientWidth;
      const displayHeight = containerRef.current.clientHeight;
      const dpr = performanceMode ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio;
      stateRef.current.dpr = dpr;
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      stateRef.current.width = canvas.width;
      stateRef.current.height = canvas.height;
      renderFrame();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageUrl || "https://images.pexels.com/photos/268533/pexels-photo-268533.jpeg?cs=srgb&dl=pexels-pixabay-268533.jpg&fm=jpg";
    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      renderFrame();
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [imageUrl, performanceMode]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', ...style }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
});

export default LiquidGlassShader;
