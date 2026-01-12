import { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { createRoot } from "react-dom/client";

/**
 * Hook to render a React component to a Three.js texture
 * @param {React.Component} Component - React component to render
 * @param {Object} props - Props to pass to the component
 * @param {number} width - Texture width in pixels
 * @param {number} height - Texture height in pixels
 * @returns {THREE.Texture|null}
 */
export function useComponentTexture(Component, props = {}, width = 2048, height = 2730) {
  const [texture, setTexture] = useState(null);
  const containerRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!Component) {
      setTexture(null);
      return;
    }

    // Create a container element
    const container = document.createElement("div");
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.background = "#ffffff";
    container.style.padding = "60px";
    container.style.boxSizing = "border-box";
    container.style.fontFamily = "serif";
    document.body.appendChild(container);
    containerRef.current = container;

    // Render React component
    const root = createRoot(container);
    root.render(<Component {...props} />);
    rootRef.current = root;

    // Wait for render, then convert to texture
    const convertToTexture = async () => {
      // Try to dynamically import html2canvas
      let html2canvas;
      try {
        html2canvas = (await import("html2canvas")).default;
      } catch (e) {
        console.warn("html2canvas not available, using fallback");
      }

      if (html2canvas) {
        try {
          const canvas = await html2canvas(container, {
            width,
            height,
            useCORS: true,
            backgroundColor: "#ffffff",
            scale: 1,
          });
          const newTexture = new THREE.CanvasTexture(canvas);
          newTexture.flipY = false;
          newTexture.needsUpdate = true;
          setTexture(newTexture);
        } catch (error) {
          console.error("Error rendering component to canvas:", error);
          // Fallback
          createFallbackTexture();
        }
      } else {
        createFallbackTexture();
      }
    };

    const createFallbackTexture = () => {
      // Fallback: create a simple canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#000000";
      ctx.font = "24px serif";
      ctx.fillText("Component rendering...", 60, 100);
      
      const newTexture = new THREE.CanvasTexture(canvas);
      newTexture.flipY = false;
      setTexture(newTexture);
    };

    // Small delay to ensure React has rendered
    setTimeout(convertToTexture, 200);

    return () => {
      if (rootRef.current) {
        rootRef.current.unmount();
      }
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
      }
      if (texture) {
        texture.dispose();
      }
    };
  }, [Component]);

  return texture;
}
