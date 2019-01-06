import tableHelper from '../lib/parsers/tableHelper';

describe('padding strings', () => {
	it('should pad an even string', () => {
		let paddedString = tableHelper.padString('test', 8);
		expect(paddedString).toBe('  test  ');
	});

	it('should pad an odd string', () => {
		let paddedString = tableHelper.padString('test', 7);
		expect(paddedString).toBe(' test  ');
	});

	it('should not pad an large enough string', () => {
		let paddedString = tableHelper.padString('test', 1);
		expect(paddedString).toBe('test');
	});
});

describe('string length', () => {
	it('should return the length of ASCII strings', () => {
		let strlen = tableHelper.stringLength('hello, world');
		expect(strlen).toBe(12);
	});

	it('should return the length of strings with Chinese chars', () => {
		let strlen = tableHelper.stringLength('你好，世界');
		expect(strlen).toBe(10);
	});

	it('should return the length of strings with Japanese chars', () => {
		let strlen = tableHelper.stringLength('こんにちは世界');
		expect(strlen).toBe(14);
	});

	it('should return the length of strings with Korean chars', () => {
		let strlen = tableHelper.stringLength('안녕, 세상');
		expect(strlen).toBe(10);
	});

	it('should return the length of strings with Arabic chars', () => {
		let strlen = tableHelper.stringLength('مرحبا بالعالم');
		expect(strlen).toBe(13);
	});

	// it('should return the length of strings with emoji chars', () => {
	// 	let strlen = tableHelper.stringLength('👋, 🌏');
	// 	expect(strlen).toBe(7);
	// });

	it('should return the length of strings with Vietnamese chars', () => {
		let strlen = tableHelper.stringLength('Chào thế giới');
		expect(strlen).toBe(13);
	});
});
