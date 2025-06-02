export const formatMathString = (text: string): string => {
  if (!text) return '';

  // Process expressions within single or double dollar signs
  const processedText = text.replace(/\$\$([\s\S]*?)\$\$|\$([\s\S]*?)\$/g, (match, displayMath, inlineMath) => {
    let mathContent = displayMath || inlineMath;
    if (!mathContent) return match; // Should not happen with this regex

    // Superscripts: e.g., x^2, x^{2+y}
    // Handles single characters/numbers or groups in {}
    mathContent = mathContent.replace(/\^(\w+|(?:\{[\s\S]*?\}))/g, (_m, p1) => {
      const content = p1.startsWith('{') && p1.endsWith('}') ? p1.slice(1, -1) : p1;
      return `<sup>${content}</sup>`;
    });

    // Subscripts: e.g., x_1, x_{1+y}
    // Handles single characters/numbers or groups in {}
    mathContent = mathContent.replace(/\_(\w+|(?:\{[\s\S]*?\}))/g, (_m, p1) => {
      const content = p1.startsWith('{') && p1.endsWith('}') ? p1.slice(1, -1) : p1;
      return `<sub>${content}</sub>`;
    });
    
    // Simple fractions: \frac{a}{b} -> (a)/(b) for readability
    // A proper rendering would require more complex HTML/CSS or a math library
    mathContent = mathContent.replace(/\\frac\{([\s\S]*?)\}\{([\s\S]*?)\}/g, '($1)/($2)');

    // Common LaTeX symbols to Unicode
    mathContent = mathContent.replace(/\\cdot/g, '·');
    mathContent = mathContent.replace(/\\times/g, '×');
    mathContent = mathContent.replace(/\\alpha/g, 'α');
    mathContent = mathContent.replace(/\\beta/g, 'β');
    mathContent = mathContent.replace(/\\gamma/g, 'γ');
    mathContent = mathContent.replace(/\\Gamma/g, 'Γ');
    mathContent = mathContent.replace(/\\delta/g, 'δ');
    mathContent = mathContent.replace(/\\Delta/g, 'Δ');
    mathContent = mathContent.replace(/\\epsilon/g, 'ε');
    mathContent = mathContent.replace(/\\zeta/g, 'ζ');
    mathContent = mathContent.replace(/\\eta/g, 'η');
    mathContent = mathContent.replace(/\\theta/g, 'θ');
    mathContent = mathContent.replace(/\\Theta/g, 'Θ');
    mathContent = mathContent.replace(/\\kappa/g, 'κ');
    mathContent = mathContent.replace(/\\lambda/g, 'λ');
    mathContent = mathContent.replace(/\\Lambda/g, 'Λ');
    mathContent = mathContent.replace(/\\mu/g, 'μ');
    mathContent = mathContent.replace(/\\nu/g, 'ν');
    mathContent = mathContent.replace(/\\xi/g, 'ξ');
    mathContent = mathContent.replace(/\\Xi/g, 'Ξ');
    mathContent = mathContent.replace(/\\pi/g, 'π');
    mathContent = mathContent.replace(/\\Pi/g, 'Π');
    mathContent = mathContent.replace(/\\rho/g, 'ρ');
    mathContent = mathContent.replace(/\\sigma/g, 'σ');
    mathContent = mathContent.replace(/\\Sigma/g, 'Σ');
    mathContent = mathContent.replace(/\\tau/g, 'τ');
    mathContent = mathContent.replace(/\\upsilon/g, 'υ');
    mathContent = mathContent.replace(/\\phi/g, 'φ');
    mathContent = mathContent.replace(/\\Phi/g, 'Φ');
    mathContent = mathContent.replace(/\\chi/g, 'χ');
    mathContent = mathContent.replace(/\\psi/g, 'ψ');
    mathContent = mathContent.replace(/\\Psi/g, 'Ψ');
    mathContent = mathContent.replace(/\\omega/g, 'ω');
    mathContent = mathContent.replace(/\\Omega/g, 'Ω');
    
    mathContent = mathContent.replace(/\\leq/g, '≤');
    mathContent = mathContent.replace(/\\geq/g, '≥');
    mathContent = mathContent.replace(/\\neq/g, '≠');
    mathContent = mathContent.replace(/\\approx/g, '≈');
    mathContent = mathContent.replace(/\\pm/g, '±');
    mathContent = mathContent.replace(/\\sqrt\[([\s\S]*?)\]\{([\s\S]*?)\}/g, '<sup>$1</sup>√($2)'); // nth root
    mathContent = mathContent.replace(/\\sqrt\{([\s\S]*?)\}/g, '√($1)'); // square root
    mathContent = mathContent.replace(/\\sum/g, '∑');
    mathContent = mathContent.replace(/\\int/g, '∫');
    mathContent = mathContent.replace(/\\partial/g, '∂');
    mathContent = mathContent.replace(/\\nabla/g, '∇');
    mathContent = mathContent.replace(/\\infty/g, '∞');
    mathContent = mathContent.replace(/\\forall/g, '∀');
    mathContent = mathContent.replace(/\\exists/g, '∃');
    mathContent = mathContent.replace(/\\in/g, '∈');
    mathContent = mathContent.replace(/\\notin/g, '∉');
    mathContent = mathContent.replace(/\\subset/g, '⊂');
    mathContent = mathContent.replace(/\\supset/g, '⊃');
    mathContent = mathContent.replace(/\\subseteq/g, '⊆');
    mathContent = mathContent.replace(/\\supseteq/g, '⊇');
    mathContent = mathContent.replace(/\\cup/g, '∪');
    mathContent = mathContent.replace(/\\cap/g, '∩');
    mathContent = mathContent.replace(/\\emptyset/g, '∅');
    mathContent = mathContent.replace(/\\therefore/g, '∴');
    mathContent = mathContent.replace(/\\because/g, '∵');
    mathContent = mathContent.replace(/\\ldots/g, '...');
    mathContent = mathContent.replace(/\\cdots/g, '⋯');
    mathContent = mathContent.replace(/\\vdots/g, '⋮');
    mathContent = mathContent.replace(/\\ddots/g, '⋱');
    mathContent = mathContent.replace(/\\ R /g, ' ℝ '); // Real numbers
    mathContent = mathContent.replace(/\\mathbb\{R\}/g, 'ℝ');
    mathContent = mathContent.replace(/\\ Z /g, ' ℤ '); // Integers
    mathContent = mathContent.replace(/\\mathbb\{Z\}/g, 'ℤ');
    mathContent = mathContent.replace(/\\ N /g, ' ℕ '); // Natural numbers
    mathContent = mathContent.replace(/\\mathbb\{N\}/g, 'ℕ');
    mathContent = mathContent.replace(/\\ Q /g, ' ℚ '); // Rational numbers
    mathContent = mathContent.replace(/\\mathbb\{Q\}/g, 'ℚ');
    mathContent = mathContent.replace(/\\ C /g, ' ℂ '); // Complex numbers
    mathContent = mathContent.replace(/\\mathbb\{C\}/g, 'ℂ');
    mathContent = mathContent.replace(/\\rightarrow/g, '→');
    mathContent = mathContent.replace(/\\leftarrow/g, '←');
    mathContent = mathContent.replace(/\\leftrightarrow/g, '↔');
    mathContent = mathContent.replace(/\\Rightarrow/g, '⇒');
    mathContent = mathContent.replace(/\\Leftarrow/g, '⇐');
    mathContent = mathContent.replace(/\\Leftrightarrow/g, '⇔');


    // If displayMath (originally $$...$$), we might want to wrap it in a div for block display
    // For now, just returning processed content. Could add:
    // if (displayMath) return `<div class="math-display">${mathContent}</div>`;
    
    return mathContent; // Return the processed math content, original $ delimiters are removed by the main replace
  });

  return processedText;
};
