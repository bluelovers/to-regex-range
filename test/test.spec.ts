'use strict';

import fill from 'fill-range';
import toRange from '../src/index';

let count = 0;

const inRange = (min, max, num) => min <= num && max >= num;
const toRegex = str => new RegExp(`^${str}$`);
const toRangeRegex = (min, max, options) => {
  return toRegex(toRange(min, max, { wrap: true, ...options }));
};

const matcher = (...args) => {
  // @ts-ignore
  const regex = toRangeRegex(...args);
  return num => regex.test(String(num));
};

const matchRange = (min, max, expected, match, notMatch) => {
  if (max - min >= 1000000) {
    throw new RangeError('range is too big');
  }

  let actual = toRange(min, max);
  //let msg = actual + ' => ' + expected;

  // test expected string
  expect(actual).toEqual(expected);

  let re = toRegex(actual);
  for (let i = 0; i < match.length; i++) {
    expect(re.test(match[i])).toBeTruthy();
    count++;
  }

  if (!Array.isArray(notMatch)) return;
  for (let j = 0; j < notMatch.length; j++) {
    expect(!re.test(notMatch[j])).toBeTruthy();
    count++;
  }
}

const verifyRange = (min, max, from, to) => {
  let isMatch = matcher(min, max);
  let minNum = Math.min(min, max);
  let maxNum = Math.max(min, max);
  let num = from - 1;

  while (++num < to) {
    let n = Number(num);
    if (inRange(minNum, maxNum, n)) {
      expect(isMatch(num)).toBeTruthy();
    } else {
      expect(!isMatch(num)).toBeTruthy();
    }
    count++;
  }
};

const verifyZeros = (min, max, from, to) => {
  let range = fill(from, to);
  let len = range.length;
  let idx = -1;

  let isMatch = matcher(min, max);
  let minNum = Math.min(min, max);
  let maxNum = Math.max(min, max);

  while (++idx < len) {
    let num = range[idx];
    let n = Number(num);
    if (inRange(minNum, maxNum, n)) {
      expect(isMatch(num)).toBeTruthy();
    } else {
      expect(!isMatch(num)).toBeTruthy();
    }
    count++;
  }
};

describe('to-regex-range', () => {
  afterAll(() => {
    console.log();
    console.log('   ', (+(+count.toFixed(2))).toLocaleString(), 'assertions');
  });

  describe('range', () => {
    it('should throw an error when the first arg is invalid:', () => {
      expect(() => toRange()).toThrow();
    });

    it('should throw an error when the second arg is invalid:', () => {
      expect(() => toRange(1, {})).toThrow();
    });

    it('should match the given numbers', () => {
      let oneFifty = toRegex(toRange(1, 150));
      expect(oneFifty.test('125')).toBeTruthy();
      expect(!oneFifty.test('0')).toBeTruthy();
      expect(oneFifty.test('1')).toBeTruthy();
      expect(oneFifty.test('126')).toBeTruthy();
      expect(oneFifty.test('150')).toBeTruthy();
      expect(!oneFifty.test('151')).toBeTruthy();

      let oneTwentyFive = toRegex(toRange(1, 125));
      expect(oneTwentyFive.test('125')).toBeTruthy();
      expect(!oneTwentyFive.test('0')).toBeTruthy();
      expect(oneTwentyFive.test('1')).toBeTruthy();
      expect(!oneTwentyFive.test('126')).toBeTruthy();
      expect(!oneTwentyFive.test('150')).toBeTruthy();
      expect(!oneTwentyFive.test('151')).toBeTruthy();
    });
  });

  describe('minimum / maximum', () => {
    it('should reverse `min/max` when the min is larger than the max:', () => {
      expect(toRange(55, 10)).toEqual('(?:1[0-9]|[2-4][0-9]|5[0-5])');
    });
  });

  describe('ranges', () => {
    it('should return the number when only one argument is passed:', () => {
      expect(toRange(5)).toEqual('5');
    });

    it('should return a single number when both numbers are equal', () => {
      expect(toRange('1', '1')).toEqual('1');
      expect(toRange('65443', '65443')).toEqual('65443');
      expect(toRange('192', '192')).toEqual('192');
      verifyRange(1, 1, 0, 100);
      verifyRange(65443, 65443, 65000, 66000);
      verifyRange(192, 192, 0, 1000);
    });

    it('should not return a range when both numbers are the same:', () => {
      expect(toRange(5, 5)).toEqual('5');
    });

    it(
      'should return regex character classes when both args are less than 10',
      () => {
        expect(toRange(0, 9)).toEqual('[0-9]');
        expect(toRange(1, 5)).toEqual('[1-5]');
        expect(toRange(1, 7)).toEqual('[1-7]');
        expect(toRange(2, 6)).toEqual('[2-6]');
      }
    );

    it('should support string numbers', () => {
      expect(toRange('1', '5')).toEqual('[1-5]');
      expect(toRange('10', '50')).toEqual('(?:1[0-9]|[2-4][0-9]|50)');
    });

    it('should support padded ranges:', () => {
      expect(toRange('001', '005')).toEqual('0{0,2}[1-5]');
      expect(toRange('01', '05')).toEqual('0?[1-5]');
      expect(toRange('001', '100')).toEqual('(?:0{0,2}[1-9]|0?[1-9][0-9]|100)');
      expect(toRange('0001', '1000')).toEqual('(?:0{0,3}[1-9]|0{0,2}[1-9][0-9]|0?[1-9][0-9]{2}|1000)');
    });

    it('should work when padding is imbalanced:', () => {
      expect(toRange('001', '105')).toEqual('(?:0{0,2}[1-9]|0?[1-9][0-9]|10[0-5])');
      expect(toRange('01', '105')).toEqual('(?:0{0,2}[1-9]|0?[1-9][0-9]|10[0-5])');
      expect(toRange('010', '105')).toEqual('(?:0?1[0-9]|0?[2-9][0-9]|10[0-5])');
      expect(toRange('010', '1005')).toEqual('(?:0{0,2}1[0-9]|0{0,2}[2-9][0-9]|0?[1-9][0-9]{2}|100[0-5])');
      expect(toRange('0001', '1000')).toEqual(toRange('001', '1000'));
      expect(toRange('0001', '1000')).toEqual(toRange('01', '1000'));
    });

    it('should generate regex strings for negative patterns', () => {
      expect(toRange(-1, 0)).toEqual('(?:-1|0)');
      expect(toRange(-1, 1)).toEqual('(?:-1|[01])');
      expect(toRange(-4, -2)).toEqual('-[2-4]');
      expect(toRange(-3, 1)).toEqual('(?:-[1-3]|[01])');
      expect(toRange(-2, 0)).toEqual('(?:-[12]|0)');
      expect(toRange(-1, 3)).toEqual('(?:-1|[0-3])');
      matchRange(-1, -1, '-1', [-1], [-2, 0, 1]);
      matchRange(-1, -10, '(?:-[1-9]|-10)', [-1, -5, -10], [-11, 0]);
      matchRange(-1, 3, '(?:-1|[0-3])', [-1, 0, 1, 2, 3], [-2, 4]);
    });

    it('should wrap patterns when options.capture is true', () => {
      expect(toRange(-1, 0, { capture: true })).toEqual('(-1|0)');
      expect(toRange(-1, 1, { capture: true })).toEqual('(-1|[01])');
      expect(toRange(-4, -2, { capture: true })).toEqual('(-[2-4])');
      expect(toRange(-3, 1, { capture: true })).toEqual('(-[1-3]|[01])');
      expect(toRange(-2, 0, { capture: true })).toEqual('(-[12]|0)');
      expect(toRange(-1, 3, { capture: true })).toEqual('(-1|[0-3])');
    });

    it('should generate regex strings for positive patterns', () => {
      expect(toRange(1, 1)).toEqual('1');
      expect(toRange(0, 1)).toEqual('(?:0|1)');
      expect(toRange(0, 2)).toEqual('[0-2]');
      expect(toRange(65666, 65667)).toEqual('(?:65666|65667)');
      expect(toRange(12, 3456)).toEqual(
        '(?:1[2-9]|[2-9][0-9]|[1-9][0-9]{2}|[12][0-9]{3}|3[0-3][0-9]{2}|34[0-4][0-9]|345[0-6])'
      );
      expect(toRange(1, 3456)).toEqual(
        '(?:[1-9]|[1-9][0-9]{1,2}|[12][0-9]{3}|3[0-3][0-9]{2}|34[0-4][0-9]|345[0-6])'
      );
      expect(toRange(1, 10)).toEqual('(?:[1-9]|10)');
      expect(toRange(1, 19)).toEqual('(?:[1-9]|1[0-9])');
      expect(toRange(1, 99)).toEqual('(?:[1-9]|[1-9][0-9])');
      expect(toRange(1, 100)).toEqual('(?:[1-9]|[1-9][0-9]|100)');
      expect(toRange(1, 1000)).toEqual('(?:[1-9]|[1-9][0-9]{1,2}|1000)');
      expect(toRange(1, 10000)).toEqual('(?:[1-9]|[1-9][0-9]{1,3}|10000)');
      expect(toRange(1, 100000)).toEqual('(?:[1-9]|[1-9][0-9]{1,4}|100000)');
      expect(toRange(1, 9999999)).toEqual('(?:[1-9]|[1-9][0-9]{1,6})');
      expect(toRange(99, 100000)).toEqual('(?:99|[1-9][0-9]{2,4}|100000)');

      matchRange(99, 100000, '(?:99|[1-9][0-9]{2,4}|100000)', [99, 999, 989, 100, 9999, 9899, 10009, 10999, 100000], [0, 9, 100001, 100009]);
    });

    it('should optimize regexes', () => {
      expect(toRange(-9, 9)).toEqual('(?:-[1-9]|[0-9])');
      expect(toRange(-19, 19)).toEqual('(?:-[1-9]|-?1[0-9]|[0-9])');
      expect(toRange(-29, 29)).toEqual('(?:-[1-9]|-?[12][0-9]|[0-9])');
      expect(toRange(-99, 99)).toEqual('(?:-[1-9]|-?[1-9][0-9]|[0-9])');
      expect(toRange(-999, 999)).toEqual('(?:-[1-9]|-?[1-9][0-9]{1,2}|[0-9])');
      expect(toRange(-9999, 9999)).toEqual('(?:-[1-9]|-?[1-9][0-9]{1,3}|[0-9])');
      expect(toRange(-99999, 99999)).toEqual('(?:-[1-9]|-?[1-9][0-9]{1,4}|[0-9])');
    });
  });

  describe('validate ranges', () => {
    it('should match all numbers in the given range', () => {
      let isMatch = matcher(1, 59);
      for (let i = 0; i < 100; i++) {
        if (i >= 1 && i <= 59) {
          expect(isMatch(i)).toBeTruthy();
        } else {
          expect(!isMatch(i)).toBeTruthy();
        }
      }
    });

    it('should support negative ranges:', () => {
      verifyRange(-9, -1, -100, 100);
      verifyRange(-99, -1, -1000, 1000);
      verifyRange(-999, -1, -1000, 1000);
      verifyRange(-9999, -1, -10000, 10000);
      verifyRange(-99999, -1, -100999, 100999);
    });

    it('should support negative-to-positive ranges:', () => {
      verifyRange(-9, 9, -100, 100);
      verifyRange(-99, 99, -1000, 1000);
      verifyRange(-999, 999, -1000, 1000);
      verifyRange(-9999, 9999, -10000, 10000);
      verifyRange(-99999, 99999, -100999, 100999);
    });

    it('should support large numbers:', () => {
      verifyRange(100019999300000, 100020000300000, 1000199992999900, 100020000200000);
    });

    it('should support large ranges:', () => {
      verifyRange(1, 100000, 1, 1000);
      verifyRange(1, 100000, 10000, 11000);
      verifyRange(1, 100000, 99000, 100000);
      verifyRange(1, 100000, 1000, 2000);
      verifyRange(1, 100000, 10000, 12000);
      verifyRange(1, 100000, 50000, 60000);
      verifyRange(1, 100000, 99999, 101000);
      verifyRange(10331, 20381, 0, 99999);
    });

    it('should support repeated digits:', () => {
      verifyRange(111, 222, 0, 999);
      verifyRange(111, 333, 0, 999);
      verifyRange(111, 444, 0, 999);
      verifyRange(111, 555, 0, 999);
      verifyRange(111, 666, 0, 999);
      verifyRange(111, 777, 0, 999);
      verifyRange(111, 888, 0, 999);
      verifyRange(111, 999, 0, 999);
      verifyRange(0, 111, -99, 999);
      verifyRange(0, 222, -99, 999);
      verifyRange(0, 333, -99, 999);
      verifyRange(0, 444, -99, 999);
      verifyRange(0, 555, -99, 999);
      verifyRange(0, 666, -99, 999);
      verifyRange(0, 777, -99, 999);
      verifyRange(0, 888, -99, 999);
      verifyRange(0, 999, -99, 999);
    });

    it('should support repeated zeros:', () => {
      verifyRange(10031, 20081, 0, 59999);
      verifyRange(10000, 20000, 0, 59999);
    });

    it('should support zero one:', () => {
      verifyRange(10301, 20101, 0, 99999);
      verifyRange(101010, 101210, 101009, 101300);
    });

    it('should support repeated ones:', () => {
      verifyRange(1, 11111, 0, 1000);
      verifyRange(1, 1111, 0, 1000);
      verifyRange(1, 111, 0, 1000);
      verifyRange(1, 11, 0, 1000);
      verifyRange(1, 1, 0, 1000);
    });

    it('should support small diffs:', () => {
      verifyRange(102, 103, 0, 1000);
      verifyRange(102, 110, 0, 1000);
      verifyRange(102, 130, 0, 1000);
    });

    it('should support random ranges:', () => {
      verifyRange(4173, 7981, 0, 99999);
    });

    it('should support one digit numbers:', () => {
      verifyRange(3, 7, 0, 99);
    });

    it('should support one digit at bounds:', () => {
      verifyRange(1, 9, 0, 1000);
    });

    it('should support power of ten:', () => {
      verifyRange(1000, 8632, 0, 99999);
    });

    it('should not match the negative of the same number', () => {
      verifyRange(1, 1000, -1000, 1000);
      verifyRange(1, 1000, '-1000', '1000');
    });

    it('should work with numbers of varying lengths:', () => {
      verifyRange(1030, 20101, 0, 99999);
      verifyRange(13, 8632, 0, 10000);
    });

    it('should support small ranges:', () => {
      verifyRange(9, 11, 0, 100);
      verifyRange(19, 21, 0, 100);
    });

    it('should support big ranges:', () => {
      verifyRange(90, 98009, 0, 98999);
      verifyRange(999, 10000, 1, 20000);
    });

    it('should create valid regex ranges with zero-padding:', () => {
      verifyZeros('001', '100', '001', 100);
      verifyZeros('001', '100', '001', '100');
      verifyZeros('0001', '1000', '01', 1000);
      verifyZeros('0001', '1000', '-01', 1000);
      verifyZeros('0001', '1000', '-099', '1000');
      verifyZeros('0001', '1000', '-010', 1000);
      verifyZeros('0001', '1000', '-010', 1000);
      verifyZeros('0001', '1000', '0001', '1000');
      verifyZeros('01', '1000', '-01', '1000');
      verifyZeros('000000001', '1000', '-010', '1000');
      verifyZeros('00000001', '1000', '-010', '1000');
      verifyZeros('0000001', '1000', '-010', '1000');
      verifyZeros('000001', '1000', '-010', '1000');
      verifyZeros('00001', '1000', '-010', '1000');
      verifyZeros('0001', '1000', '-010', '1000');
      verifyZeros('001', '1000', '-010', '1000');
      verifyZeros('01', '1000', '-010', '1000');
      verifyZeros('0001', '1000', '-010', '1000');
    });

    it('should create valid regex ranges with negative padding:', () => {
      verifyZeros('-00001', '-1000', -1000, 1000);
      verifyZeros('-0001', '-1000', -1000, 1000);
      verifyZeros('-001', '-1000', -1000, 1000);
      verifyZeros('-01', '-1000', -1000, 1000);
    });

    it('should create valid ranges with neg && pos zero-padding:', () => {
      verifyZeros('-01', '10', '-1', '01');
      verifyZeros('-1000', '100', -1000, 1000);
      verifyZeros('-1000', '0100', '-010', '1000');
      verifyZeros('-0100', '100', '-01', '100');
      verifyZeros('-010', '100', '-01', '100');
      verifyZeros('-01', '100', '-01', '100');
      verifyZeros('-01000', '1000', '-010', '1000');
      verifyZeros('-0100', '1000', '-010', '1000');
      verifyZeros('-010', '1000', '-010', '1000');
      verifyZeros('-01', '1000', '-010', '1000');
    });
  });
});
