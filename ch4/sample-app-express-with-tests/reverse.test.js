const reverse = require('./reverse');

describe('test reverseWords', () => {                   
  test('hello world => world hello', () => {            
    const result = reverse.reverseWords('hello world'); 
    expect(result).toBe('world hello');                 
  });

  test('handles trailing whitespace   => whitespace trailing handles', () => {
    const result = reverse.reverseWords('handles trailing whitespace   ');
    expect(result).toBe('whitespace trailing handles');
  });
});

describe('test reverseCharacters', () => {
  test('abcd => dcba', () => {
    const result = reverse.reverseCharacters('abcd');
    expect(result).toBe('dcba');
  });
});
