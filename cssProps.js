const cssConfig = {
	color: { type: 'color' },
	'background-color': { type: 'color' },
	'font-size': { type: 'px' },
	'font-family': { type: 'dropdown', options: ['', 'Arial', 'Verdana', 'Tahoma', 'Times New Roman', 'Courier New', 'monospace'] },
	'font-weight': { type: 'dropdown', options: ['500', '600', '700', 'bold', 'bolder'] },
	position: { type: 'dropdown', options: ['default', 'static', 'relative', 'absolute'] },
        top: { type: 'px', unlocked: { position: ['absolute', 'relative'] } },
        left: { type: 'px', unlocked: { position: ['absolute', 'relative'] } },
        right: { type: 'px', unlocked: { position: ['absolute', 'relative'] } },
        bottom: { type: 'px', unlocked: { position: ['absolute', 'relative'] } },
	boxShadowX: { type: 'px' },
	boxShadowY: { type: 'px' },
	boxShadowBlur: { type: 'px' },
	boxShadowColor: { type: 'color' },
	padding: { type: 'px' },
	margin: { type: 'px' }
};


function rgbToHex(rgb) {
	const result = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
	if (!result) return rgb;
	return (
		'#' + [1, 2, 3].map(i => {
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
	const props = {};
	const styleMap = {};
	if (styleString) {
		styleString.split(';').forEach(pair => {
			const [k, v] = pair.split(':');
			if (!k || !v) return;
			styleMap[k.trim()] = v.trim();
		});
	}

    Object.keys(config).forEach(key => {
		props[key] = { ...config[key] };
		
		if (config[key].type === 'color') {
			let val = styleMap[key];
			if (val) {
				if (val.startsWith('rgb')) val = rgbToHex(val);
				props[key].value = val;
			} else {
				props[key].value = '';
			}
		} else if (config[key].type === 'dropdown') {
			if (styleMap[key] !== undefined) {
				props[key].value = styleMap[key];
			} else {
				props[key].value = '';
			}
		} else if (config[key].type === 'px') {
			if (key.startsWith('boxShadow')) return;
			if (styleMap[key] !== undefined) {
				props[key].value = safePx(styleMap[key], 0);
			} else {
				props[key].value = '';
			}
		}
	});

    let boxShadow = styleMap['box-shadow'];
	if (boxShadow && boxShadow !== 'none') {
		const parts = boxShadow.split(' ');
		props.boxShadowX.value = safePx(parts[0], 0);
		props.boxShadowY.value = safePx(parts[1], 0);
		props.boxShadowBlur.value = safePx(parts[2], 0);
		let color = parts[3] || '';
		if (color && color.startsWith('rgb')) color = rgbToHex(color);
		props.boxShadowColor.value = color;
	} else {
		props.boxShadowX.value = '';
		props.boxShadowY.value = '';
		props.boxShadowBlur.value = '';
		props.boxShadowColor.value = '';
	}
	return props;
}

function applyCssProps(element, props, config = cssConfig) {
	Object.keys(config).forEach(key => {
		const prop = config[key];
		const val = props[key]?.value;
		
		if (key.startsWith('boxShadow')) {
			return;
		}
		
		if (prop.type === 'color') {
			if (val !== '' && val !== undefined && val !== null) {
				element.style.setProperty(key, val);
			}
		} else if (prop.type === 'px') {
			if (val !== '' && val !== undefined && val !== null) {
				element.style.setProperty(key, val + 'px');
			}
		} else if (prop.type === 'dropdown') {
			if (val !== '' && val !== undefined && val !== null && val !== 'default') {
				element.style.setProperty(key, val);
			}
		}
	});

	const bx = props.boxShadowX?.value;
	const by = props.boxShadowY?.value;
	const blur = props.boxShadowBlur?.value;
	const color = props.boxShadowColor?.value;
	
	if (bx !== '' && bx !== undefined && bx !== null) {
		element.style.setProperty('box-shadow', `${bx||0}px ${by||0}px ${blur||0}px ${color||'#000000'}`);
	}
}
