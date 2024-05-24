const reverse = require('./reverse');

describe('test reverseWords', () => {                   
  test('hello world => world hello', () => {            
    const result = reverse.reverseWords('hello world'); 
    expect(result).toBe('world hello');                 
  });

  test('trailing whitespace   => whitespace trailing', () => {
    const result = reverse.reverseWords('trailing whitespace   ');
    expect(result).toBe('whitespace trailing');
  });
});

describe('test reverseCharacters', () => {
  test('abcd => dcba', () => {
    const result = reverse.reverseCharacters('abcd');
    expect(result).toBe('dcba');
  });
});
