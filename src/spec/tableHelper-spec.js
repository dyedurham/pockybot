var tableHelper = require(__base + "src/lib/parsers/tableHelper");

describe("padding strings", function() {
	it("should pad an even string", function () {
		paddedString = tableHelper.padString("test", 8);
		expect(paddedString).toBe("  test  ");
	});

	it("should pad an odd string", function () {
		paddedString = tableHelper.padString("test", 7);
		expect(paddedString).toBe(" test  ");
	});

	it("should not pad an large enough string", function () {
		paddedString = tableHelper.padString("test", 1);
		expect(paddedString).toBe("test");
	});
});

describe("string length", function() {
	it("should return the length of ASCII strings", function() {
		strlen = tableHelper.stringLength("hello, world");
		expect(strlen).toBe(12);
	});

	it("should return the length of strings with Chinese chars", function() {
		strlen = tableHelper.stringLength("你好，世界");
		expect(strlen).toBe(10);
	});

	it("should return the length of strings with Japanese chars", function() {
		strlen = tableHelper.stringLength("こんにちは世界");
		expect(strlen).toBe(14);
	});

	it("should return the length of strings with Korean chars", function() {
		strlen = tableHelper.stringLength("안녕, 세상");
		expect(strlen).toBe(10);
	});

	it("should return the length of strings with Arabic chars", function() {
		strlen = tableHelper.stringLength("مرحبا بالعالم");
		expect(strlen).toBe(13);
	});

	// it("should return the length of strings with emoji chars", function() {
	// 	strlen = tableHelper.stringLength("👋, 🌏");
	// 	expect(strlen).toBe(7);
	// });

	it("should return the length of strings with Vietnamese chars", function() {
		strlen = tableHelper.stringLength("Chào thế giới");
		expect(strlen).toBe(13);
	});
});
