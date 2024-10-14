function reverseWords(str) {
    return str
      .trim() 
      .split(' ')
      .reverse()
      .join(' ');
  }
  
  function reverseCharacters(str) {
    return str
      .split('')
      .reverse()
      .join('');
  }
  
  module.exports = {reverseCharacters, reverseWords};