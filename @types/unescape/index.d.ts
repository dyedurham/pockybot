declare module 'unescape'{
	function unescape (str : string, type ?: 'all' | 'default' | 'extras') : string;
	namespace unescape {
		export var chars: {[key: string] : string};
		export var extras: {[key: string] : string};
	}

	export = unescape;
}
