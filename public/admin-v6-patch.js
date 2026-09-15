// PATCH: Premium template variant/shape override fix
// ISSUE: badgeHTML variant logic was overwriting template shape with 'gradient' class
// when gradientEnabled=true, breaking premium-liquid, premium-aurora etc rendering
// 
// FIX: Keep template's inherent variant (shape class) intact always.
// Gradient color override is separate from variant/shape class.
//
// BEFORE (line 104):
// variant=s.colors.gradientEnabled?'gradient':t.variant
//
// AFTER:
// variant=t.variant  (always use template's native shape class)
// Handle gradient colors via CSS variables only (--bg, --gradient1, --gradient2)

// To apply: In badgeHTML function (line 104), change:
//   OLD: variant=s.colors.gradientEnabled?'gradient':t.variant,
//   NEW: variant=t.variant,
// 
// CSS already handles gradient rendering via:
//   const bg=s.colors.gradientEnabled?s.colors.gradient1:tc.bg
//   const style=`--bg:${bg};--gradient1:${s.colors.gradient1};--gradient2:${s.colors.gradient2}...`
// 
// This way:
// - premium-liquid keeps its 'liquid' shape class (eğimli form)
// - premium-aurora keeps its 'premium-aurora' shape class
// - nav-pill keeps its 'pill' shape class (yuvarlak)
// - Gradient colors are applied via CSS variables, not via variant class override

console.log('[PATCH] Premium template variant fix loaded');

