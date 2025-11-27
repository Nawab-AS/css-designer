const cssConfig = {
	color: { type: 'color', value: '#000000' },
	'background-color': { type: 'color', value: '#ffffff' },
	'font-size': { type: 'px', value: 16 },
	'font-family': { type: 'dropdown', value: '', options: ['', 'Arial', 'Verdana', 'Tahoma', 'Times New Roman', 'Courier New', 'monospace'] },
	'font-weight': { type: 'dropdown', value: '500', options: ['500', '600', '700', 'bold', 'bolder'] },
	position: { type: 'dropdown', value: 'default', options: ['default', 'static', 'relative', 'absolute'] },
        top: { type: 'px', value: '', unlocked: { position: ['absolute', 'relative'] } },
        left: { type: 'px', value: '', unlocked: { position: ['absolute', 'relative'] } },
        right: { type: 'px', value: '', unlocked: { position: ['absolute', 'relative'] } },
        bottom: { type: 'px', value: '', unlocked: { position: ['absolute', 'relative'] } },
	boxShadowX: { type: 'px', value: 0 },
	boxShadowY: { type: 'px', value: 0 },
	boxShadowBlur: { type: 'px', value: 0 },
	boxShadowColor: { type: 'color', value: '#000000' },
	padding: { type: 'px', value: 0 },
	margin: { type: 'px', value: 0 }
};


function rgbToHex(rgb) {
	const result = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
	if (!result) return rgb;
	return (
		'#' +
		[1, 2, 3]
			.map(i => {
				const hex = parseInt(result[i]).toString(16);
				return hex.length === 1 ? '0' + hex : hex;
			})
			.join('')
	);
}

function safePx(val, def) {
	if (typeof val === 'number') return val;
	if (!val || val === '') return def;
	const num = parseInt(val.replace(/[^\d.-]/g, ''));
	return isNaN(num) ? def : num;
}

function parseInitialStyles(styleString, config = cssConfig) {
	const props = JSON.parse(JSON.stringify(config));
	const styleMap = {};
	if (styleString) {
		styleString.split(';').forEach(pair => {
			const [k, v] = pair.split(':');
			if (!k || !v) return;
			styleMap[k.trim()] = v.trim();
		});
	}

    Object.keys(config).forEach(key => {
		if (config[key].type === 'color') {
			let val = styleMap[key] !== undefined ? styleMap[key] : config[key].value;
			if (val && val.startsWith('rgb')) val = rgbToHex(val);
			props[key].value = val;
		} else if (config[key].type === 'dropdown') {
			props[key].value = styleMap[key] !== undefined ? styleMap[key] : config[key].value;
		} else if (config[key].type === 'px') {
			if (key.startsWith('boxShadow')) return;
			let val = styleMap[key];
			props[key].value = safePx(val, config[key].value);
		}
	});

    let boxShadow = styleMap['box-shadow'];
	if (boxShadow) {
		const parts = boxShadow.split(' ');
		props.boxShadowX.value = safePx(parts[0], config.boxShadowX.value);
		props.boxShadowY.value = safePx(parts[1], config.boxShadowY.value);
		props.boxShadowBlur.value = safePx(parts[2], config.boxShadowBlur.value);
		let color = parts[3] || config.boxShadowColor.value;
		if (color && color.startsWith('rgb')) color = rgbToHex(color);
		props.boxShadowColor.value = color;
	} else {
		props.boxShadowX.value = config.boxShadowX.value;
		props.boxShadowY.value = config.boxShadowY.value;
		props.boxShadowBlur.value = config.boxShadowBlur.value;
		props.boxShadowColor.value = config.boxShadowColor.value;
	}
	return props;
}

function resolveCssProps(props, config = cssConfig) {
	let style = '';
	Object.keys(config).forEach(key => {
		const prop = config[key];
		const val = props[key]?.value ?? prop.value;
		if (prop.type === 'color') {
			style += `${key}:${val || ''};`;
		} else if (prop.type === 'px') {
			if (key.startsWith('boxShadow')) return;
			style += `${key}:${val !== '' && val !== undefined ? val : ''}${val !== '' && val !== undefined ? 'px' : ''};`;
			       } else if (prop.type === 'dropdown') {
				       style += `${key}:${val || ''};`;
		}
	});

	const bx = props.boxShadowX?.value ?? config.boxShadowX.value;
	const by = props.boxShadowY?.value ?? config.boxShadowY.value;
	const blur = props.boxShadowBlur?.value ?? config.boxShadowBlur.value;
	const color = props.boxShadowColor?.value ?? config.boxShadowColor.value;
	style += `box-shadow:${bx||0}px ${by||0}px ${blur||0}px ${color};`;
	return style;
}
