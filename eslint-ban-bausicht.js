// Build guard to prevent "Bausicht" usage
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban usage of "Bausicht" in code and comments',
      category: 'Best Practices',
    },
    messages: {
      bannedTerm: 'Usage of "Bausicht" is not allowed. Use approved wording from WORDING constants.',
    },
  },
  create(context) {
    function checkNode(node) {
      const sourceCode = context.getSourceCode();
      const text = sourceCode.getText(node);
      
      if (text.includes('Bausicht')) {
        context.report({
          node,
          messageId: 'bannedTerm',
        });
      }
    }

    return {
      Program(node) {
        // Check entire program for banned term
        const sourceCode = context.getSourceCode();
        const text = sourceCode.getText();
        
        if (text.includes('Bausicht')) {
          context.report({
            node,
            messageId: 'bannedTerm',
          });
        }
      },
      Literal: checkNode,
      TemplateElement: checkNode,
      JSXText: checkNode,
    };
  },
};