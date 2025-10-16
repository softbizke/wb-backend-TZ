//string formater utility functions
module.exports.cleanProductName = (productName) => {
  // Regular expressions for different patterns
  const patterns = [
    //50kg
    {
      pattern: /\b50\s*Kgs?\b|\b50\s*KG\b|\b50\s*kg\b/i,
      transform: () => "50Kg",
    },

     //45kg
    {
      pattern: /\b45\s*Kgs?\b|\b45\s*KG\b|\b45\s*kg\b/i,
      transform: () => "45Kg",
    },
    //25
    {
      pattern: /\b25\s*Kgs?\b|\b25\s*KG\b|\b25\s*kg\b/i,
      transform: () => "25Kg",
    },
    // 10kg
    {
      pattern: /\b10\s*Kgs?\b|\b10\s*KG\b|\b10\s*kg\b/i,
      transform: () => "10Kg",
    },
   
    // Pattern for "12 PACK" or similar
    { pattern: /(\d+)\s*PACK/i, transform: (match) => `${match[1]}Pack` },
    // Pattern for "12x1Kgs" or "12x2Kgs" and similar
    { pattern: /\d+x\d+Kgs/, transform: (match) => match[0] },
    { pattern: /\d+x\d+Kg/, transform: (match) => match[0] },
    // Match "12x1Kg", "24x0.5Kg" etc.
    {
      pattern: /(\d+x\d+(?:\.\d+)?Kg)/i,
      transform: (match) => match[1],
    },
    {
      pattern: /(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*Kgs?/i,
      transform: (match) => `${match[1]}x${match[2]}Kg`,
    },
    // Pattern for "5Kgs", "10Kgs" and similar
    {
      pattern: /\d+Kgs - Bag/,
      transform: (match) => match[0],
    },
    {
      pattern: /\d+Kg - Bag/,
      transform: (match) => match[0].replace(/-/g, "").replace(/\s{2,}/g, " "),
    },

    // Remove everything after "Wheat Bran" or "Maize Bran" followed by weight or packaging
    {
      pattern: /^(Wheat Bran|Maize Bran)(\s*\d+kg)?(.*)/i,
      transform: (match) => match[1],
    },

    // For cases like "Dola Maize Flour 12x1Kgs - Packet Packaging" => "12x1Kgs"
    { pattern: /(\d+x\d+Kgs)/, transform: (match) => match[0] },

    // For cases where you want to remove packaging info at the end
    { pattern: /-.*$/, transform: () => "" },
  ];

  // Loop through patterns and apply the first matching one
  for (let { pattern, transform } of patterns) {
    const match = productName.match(pattern);
    if (match) {
      return transform(match);
    }
  }

  return productName; // Return the original name if no match
};
