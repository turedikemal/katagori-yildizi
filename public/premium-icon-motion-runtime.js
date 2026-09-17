/**
 * Premium Icon Motion Runtime Fix
 * Applies minimal, CSS-independent transform animations to premium-elite badge icons
 * only. Uses requestAnimationFrame to ensure icon motion is visible regardless of
 * DOM cloning, CSS containment, or template switching.
 *
 * Selector: :is(.ky-v3-badge[class*="tpl-premium-elite-"], .ky-badge-root[class*="ky-tpl-premium-elite-"]) > .ky-premium-icon
 * Does NOT target basic icon/emblem classes.
 */

(function initPremiumIconMotion() {
  // Ensure this runs only once per page load
  if (window.__kyPremiumIconMotionActive) return;
  window.__kyPremiumIconMotionActive = true;

  const SELECTOR = ':is(.ky-v3-badge[class*="tpl-premium-elite-"], .ky-badge-root[class*="ky-tpl-premium-elite-"]) > .ky-premium-icon';
  const MOTION_CONFIGS = {
    'crown-orbit': { motion: 'float', amplitude: 3, frequency: 0.4 },
    'trophy-glow': { motion: 'pulse', amplitude: 1.08, frequency: 0.56 },
    'medal-spin': { motion: 'gentleSpin', durationSeconds: 3.5 },
    'flame-winner': { motion: 'flame', amplitude: 2, frequency: 0.5 },
    'diamond-shine': { motion: 'pulse', amplitude: 1.12, frequency: 0.45 },
    'rocket-rank': { motion: 'lift', amplitude: 3, frequency: 0.5 },
    'shield-spark': { motion: 'pulse', amplitude: 1.06, frequency: 0.67 },
    'laurel-star': { motion: 'sway', amplitude: 3, frequency: 0.83 },
    'bolt-ring': { motion: 'pulse', amplitude: 1.1, frequency: 1 },
    'gift-pop': { motion: 'bounce', amplitude: 2.5, frequency: 0.42 },
    'heart-crown': { motion: 'pulse', amplitude: 1.09, frequency: 0.53 },
    'check-burst': { motion: 'gentleSpin', durationSeconds: 4 }
  };

  let rafId = null;
  let eligibleElements = new Map(); // Map (not WeakMap) to support forEach and size
  let mutationObserver = null;

  /**
   * Apply inline transform with 'important' flag to bypass cascade
   */
  function applyMotionTransform(element, transform) {
    element.style.setProperty('transform', transform, 'important');
  }

  /**
   * Clean up runtime-applied styles from an element
   * Called when an element leaves premium-elite scope or is detached
   */
  function cleanupElement(element) {
    element.style.removeProperty('transform');
    element.style.removeProperty('will-change');
    element.style.removeProperty('transform-origin');
    eligibleElements.delete(element);
  }

  /**
   * Compute motion transform based on elapsed time
   */
  function computeMotionTransform(motionType, config, elapsed) {
    if (motionType === 'gentleSpin' || motionType === 'spin') {
      // Spin: use durationSeconds for period control
      const durationMs = (config.durationSeconds || 3.5) * 1000;
      const rotDeg = (elapsed % durationMs) / durationMs * 360;
      return `rotate(${rotDeg.toFixed(1)}deg)`;
    }

    const frequency = config.frequency || 1;
    const cycle = (elapsed / 1000) * frequency;

    switch (motionType) {
      case 'float':
        // Vertical float: translateY oscillates between -amplitude and +amplitude (2-4px)
        return `translateY(${config.amplitude * Math.sin(cycle * Math.PI * 2)}px)`;

      case 'pulse':
        // Scale pulse: oscillates between 1 and amplitude (1.06-1.12)
        const scale = 1 + (config.amplitude - 1) * (Math.sin(cycle * Math.PI * 2) + 1) / 2;
        return `scale(${scale.toFixed(3)})`;

      case 'flame':
        // Flame breathing: scale 1.00-1.08 and slight vertical movement
        const flameScale = 1 + 0.08 * (Math.sin(cycle * Math.PI * 2) + 1) / 2;
        const flameY = 2 * Math.sin(cycle * Math.PI * 2);
        return `scale(${flameScale.toFixed(3)}) translateY(${flameY.toFixed(1)}px)`;

      case 'lift':
        // Upward lift and gentle scale (2-4px vertical, 1.06-1.10 scale)
        const liftY = config.amplitude * Math.sin(cycle * Math.PI * 2);
        const liftScale = 1 + 0.08 * (Math.sin(cycle * Math.PI * 2) + 1) / 2;
        return `translateY(${liftY.toFixed(1)}px) scale(${liftScale.toFixed(3)})`;

      case 'sway':
        // Horizontal sway oscillation (2-4px)
        return `translateX(${config.amplitude * Math.sin(cycle * Math.PI * 2)}px)`;

      case 'bounce':
        // Bounce: vertical with slight scale pulse
        const bounceY = config.amplitude * Math.abs(Math.sin(cycle * Math.PI * 2));
        const bounceScale = 1 + 0.08 * Math.abs(Math.sin(cycle * Math.PI * 2));
        return `translateY(${bounceY.toFixed(1)}px) scale(${bounceScale.toFixed(3)})`;

      default:
        return 'none';
    }
  }

  /**
   * Scan DOM and update eligible elements set
   */
  function updateEligibleElements() {
    const elements = document.querySelectorAll(SELECTOR);
    const seenElements = new Set(elements);
    let hadChanges = false;

    // Remove elements no longer in premium-elite scope or detached
    for (const [element, _] of eligibleElements.entries()) {
      if (!seenElements.has(element) || !element.isConnected) {
        cleanupElement(element);
        hadChanges = true;
      }
    }

    // Add or update eligible elements
    let newEligibleCount = 0;
    elements.forEach((element) => {
      if (!eligibleElements.has(element)) {
        // Determine motion config from element's classes
        let config = null;
        for (const [iconClass, motionConfig] of Object.entries(MOTION_CONFIGS)) {
          if (element.classList.contains(iconClass)) {
            config = motionConfig;
            break;
          }
        }

        if (config) {
          // Apply inline styles for motion
          element.style.setProperty('transform-origin', 'center', 'important');
          element.style.setProperty('will-change', 'transform', 'important');
          eligibleElements.set(element, {
            config,
            startTime: performance.now()
          });
          newEligibleCount++;
          hadChanges = true;
        }
      }
    });

    // Auto-restart RAF if new eligible elements found and RAF not running
    if (newEligibleCount > 0 && rafId === null) {
      startAnimationLoop();
    }

    return hadChanges;
  }

  /**
   * Main animation loop
   */
  function animationLoop(now) {
    for (const [element, trackData] of eligibleElements.entries()) {
      // Skip if element is detached
      if (!element.isConnected) {
        cleanupElement(element);
        continue;
      }

      const { config, startTime } = trackData;
      const elapsed = now - startTime;

      const transform = computeMotionTransform(
        config.motion,
        config,
        elapsed
      );

      applyMotionTransform(element, transform);
    }

    // Only continue RAF if there are still eligible elements
    if (eligibleElements.size > 0) {
      rafId = requestAnimationFrame(animationLoop);
    } else {
      rafId = null;
    }
  }

  /**
   * Start the single RAF loop
   */
  function startAnimationLoop() {
    if (!rafId) {
      rafId = requestAnimationFrame(animationLoop);
    }
  }

  /**
   * Initialize MutationObserver to track DOM changes
   */
  function initMutationObserver() {
    const config = {
      childList: true,
      attributes: true,
      attributeFilter: ['class'],
      subtree: true,
      attributeOldValue: false
    };

    mutationObserver = new MutationObserver(() => {
      updateEligibleElements();
    });

    mutationObserver.observe(document.body, config);
  }

  /**
   * Initialize the entire system
   */
  function init() {
    // Initial scan
    updateEligibleElements();

    // Start RAF loop if eligible elements exist
    if (eligibleElements.size > 0) {
      startAnimationLoop();
    }

    // Initialize MutationObserver to track class/structure changes
    initMutationObserver();
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

