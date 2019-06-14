function distinct(array: any[], comparator?: (value1: any, value2: any) => number): any[] {
	if (comparator) {
		return distinctWithComparator(array, comparator);
	} else {
		return distinctWithoutComparator(array);
	}
}

function distinctWithComparator(array: any[], comparator: (value1: any, value2: any) => number): any[] {
	return array.sort(comparator).filter((value, index, array) => index === 0 || comparator(value, array[index - 1]) !== 0);
}

function distinctWithoutComparator(array: any[]): any[] {
	return array.filter((value, index, array) => index === array.indexOf(value));
}

export {
	distinct
}
