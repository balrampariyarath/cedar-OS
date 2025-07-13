import React from 'react';

const CustomMention: React.FC<any> = ({ node }: any) => {
	const { label } = node.attrs;
	return (
		<span className='inline-flex items-center bg-blue-100 text-blue-800 px-1 rounded'>
			@{label}
		</span>
	);
};

export default CustomMention;
