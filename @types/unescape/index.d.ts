declare module 'unescape'{
	function unescape (str : string, type ?: 'all' | 'default' | 'extras') : string;
	namespace unescape {
		export let chars: {[key: string] : string};
		export let extras: {[key: string] : string};
	}

	export = unescape;
}
