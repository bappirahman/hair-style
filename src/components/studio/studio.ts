/**
 * The hairstyle studio.
 *
 * Everything here runs on the user's device. The photo is read into an
 * ImageBitmap, composited on a canvas, and released when the page unloads —
 * there is no upload path in this file, deliberately and verifiably.
 *
 * Preview and export share one `paint()` so the downloaded PNG is the on-screen
 * result at native resolution rather than a second, subtly different render.
 */

import {
	DEFAULT_ADJUSTMENTS,
	fitOverlay,
	scaleOutput,
	type Adjustments,
	type Point,
} from '../../lib/compose.ts';

type Phase = 'empty' | 'align-left' | 'align-right' | 'ready';

interface StyleMeta {
	id: string;
	name: string;
	src: string;
	leftEye: Point;
	rightEye: Point;
}

interface Tint {
	id: string;
	label: string;
	colour: string | null;
	brightness: number;
}

const TINTS: Tint[] = [
	{ id: 'natural', label: 'As drawn', colour: null, brightness: 1 },
	{ id: 'jet', label: 'Jet black', colour: '#171a22', brightness: 0.72 },
	{ id: 'dark-brown', label: 'Dark brown', colour: '#3a2416', brightness: 0.94 },
	{ id: 'chestnut', label: 'Chestnut', colour: '#7a4a24', brightness: 1.12 },
	{ id: 'auburn', label: 'Auburn', colour: '#8c3d1c', brightness: 1.1 },
	{ id: 'blonde', label: 'Blonde', colour: '#c69b4e', brightness: 1.5 },
	{ id: 'platinum', label: 'Platinum', colour: '#cfc4ad', brightness: 1.85 },
	{ id: 'grey', label: 'Grey', colour: '#9c9a97', brightness: 1.5 },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function initStudio(root: HTMLElement): void {
	const $ = <T extends HTMLElement = HTMLElement>(name: string) =>
		root.querySelector<T>(`[data-studio-${name}]`);
	const $$ = <T extends HTMLElement = HTMLElement>(name: string) =>
		Array.from(root.querySelectorAll<T>(`[data-studio-${name}]`));

	const stage = $('stage')!;
	const stageFrame = $('frame')!;
	const canvas = $<HTMLCanvasElement>('canvas')!;
	const original = $<HTMLImageElement>('original')!;
	const dropzone = $('dropzone')!;
	const fileInput = $<HTMLInputElement>('file')!;
	const refInput = $<HTMLInputElement>('ref-file')!;
	const markers = $('markers')!;
	const hint = $('hint')!;
	// Two panels carry controls (the action bar and the sidebar); both toggle.
	const controlPanels = $$('controls');
	const rail = $('rail')!;
	const compareInput = $<HTMLInputElement>('compare')!;
	const styleLabel = $('style-label')!;
	const ctx = canvas.getContext('2d', { alpha: false })!;

	// ---- State ----------------------------------------------------------
	let phase: Phase = 'empty';
	let photo: ImageBitmap | null = null;
	let photoUrl: string | null = null;
	let leftEye: Point | null = null;
	let rightEye: Point | null = null;
	let adjust: Adjustments = { ...DEFAULT_ADJUSTMENTS };
	let opacity = 1;
	let tint = TINTS[0]!;
	let active: StyleMeta | null = null;
	let overlay: HTMLImageElement | null = null;
	let tinted: HTMLCanvasElement | null = null;

	const overlayCache = new Map<string, HTMLImageElement>();
	const styles = new Map<string, StyleMeta>();

	for (const button of $$<HTMLButtonElement>('style')) {
		const meta: StyleMeta = {
			id: button.dataset.id!,
			name: button.dataset.name!,
			src: button.dataset.src!,
			leftEye: { x: Number(button.dataset.lx), y: Number(button.dataset.ly) },
			rightEye: { x: Number(button.dataset.rx), y: Number(button.dataset.ry) },
		};
		styles.set(meta.id, meta);
		button.addEventListener('click', () => void selectStyle(meta.id));
	}

	// ---- Painting -------------------------------------------------------

	/** Rebuild the recoloured copy. Cheap enough to do on every tint change. */
	function buildTinted(): void {
		tinted = null;
		if (!overlay || !tint.colour) return;
		const c = document.createElement('canvas');
		c.width = overlay.naturalWidth;
		c.height = overlay.naturalHeight;
		const tc = c.getContext('2d')!;
		tc.filter = `brightness(${tint.brightness})`;
		tc.drawImage(overlay, 0, 0);
		tc.filter = 'none';
		// `color` keeps the overlay's luminance and takes hue and saturation from
		// the fill, which is what recolouring hair actually means. The alpha is
		// then restored, because the fill covered the transparent margin too.
		tc.globalCompositeOperation = 'color';
		tc.fillStyle = tint.colour;
		tc.fillRect(0, 0, c.width, c.height);
		tc.globalCompositeOperation = 'destination-in';
		tc.drawImage(overlay, 0, 0);
		tinted = c;
	}

	/**
	 * The single render path. `scale` maps photo pixels to output pixels, so the
	 * preview passes the display ratio and the export passes 1.
	 */
	function paint(target: CanvasRenderingContext2D, scale: number): void {
		if (!photo) return;
		const w = Math.round(photo.width * scale);
		const h = Math.round(photo.height * scale);
		target.setTransform(1, 0, 0, 1, 0, 0);
		target.clearRect(0, 0, w, h);
		target.drawImage(photo, 0, 0, w, h);

		const source = tinted ?? overlay;
		if (!source || !active || !leftEye || !rightEye) return;

		const m = scaleOutput(
			fitOverlay({
				overlayLeftEye: active.leftEye,
				overlayRightEye: active.rightEye,
				photoLeftEye: leftEye,
				photoRightEye: rightEye,
				adjustments: adjust,
			}),
			scale,
		);
		target.globalAlpha = opacity;
		target.imageSmoothingQuality = 'high';
		target.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
		target.drawImage(source, 0, 0);
		target.setTransform(1, 0, 0, 1, 0, 0);
		target.globalAlpha = 1;
	}

	let frame = 0;
	function render(): void {
		if (frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			if (!photo) return;
			const rect = stage.getBoundingClientRect();
			if (rect.width === 0) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const scale = (rect.width * dpr) / photo.width;
			canvas.width = Math.round(photo.width * scale);
			canvas.height = Math.round(photo.height * scale);
			paint(ctx, scale);
		});
	}

	// ---- Phase and chrome -------------------------------------------------
	const HINTS: Record<Phase, string> = {
		empty: '',
		'align-left': 'Click the centre of the eye on the LEFT of the photo.',
		'align-right': 'Now click the centre of the eye on the RIGHT of the photo.',
		ready: 'Drag to reposition. Scroll or pinch to resize.',
	};

	function setPhase(next: Phase): void {
		phase = next;
		hint.textContent = HINTS[next];
		dropzone.hidden = next !== 'empty';
		stage.hidden = next === 'empty';
		stageFrame.hidden = next === 'empty';
		for (const panel of controlPanels) panel.hidden = next !== 'ready';
		rail.hidden = next !== 'ready';
		stage.style.cursor = next === 'ready' ? 'grab' : 'crosshair';
		drawMarkers();
	}

	function drawMarkers(): void {
		markers.textContent = '';
		if (!photo) return;
		for (const [eye, label] of [
			[leftEye, 'Left eye'],
			[rightEye, 'Right eye'],
		] as const) {
			if (!eye) continue;
			const dot = document.createElement('span');
			dot.className =
				'pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-copper-400 bg-copper-400/25';
			dot.style.left = `${(eye.x / photo.width) * 100}%`;
			dot.style.top = `${(eye.y / photo.height) * 100}%`;
			dot.setAttribute('aria-label', label);
			markers.append(dot);
		}
		markers.hidden = phase === 'ready';
	}

	// ---- Photo ------------------------------------------------------------
	async function loadPhoto(file: File): Promise<void> {
		if (!file.type.startsWith('image/')) return;
		const bitmap = await createImageBitmap(file);
		photo?.close();
		photo = bitmap;
		if (photoUrl) URL.revokeObjectURL(photoUrl);
		photoUrl = URL.createObjectURL(file);
		original.width = bitmap.width;
		original.height = bitmap.height;
		original.src = photoUrl;
		// Height-first sizing keeps a tall portrait inside the viewport; the
		// aspect ratio then derives the width, and max-width caps landscape.
		stage.style.aspectRatio = `${bitmap.width} / ${bitmap.height}`;
		leftEye = null;
		rightEye = null;
		adjust = { ...DEFAULT_ADJUSTMENTS };
		// The nudge range is in photo pixels, so it has to scale with the photo.
		const reach = Math.round(bitmap.height * 0.16);
		nudgeInput.min = String(-reach);
		nudgeInput.max = String(reach);
		nudgeInput.step = String(Math.max(1, Math.round(reach / 120)));
		syncControls();
		setPhase('align-left');
		render();
	}

	fileInput.addEventListener('change', () => {
		const file = fileInput.files?.[0];
		if (file) void loadPhoto(file);
	});

	for (const event of ['dragenter', 'dragover'] as const) {
		dropzone.addEventListener(event, (e) => {
			e.preventDefault();
			dropzone.dataset.over = 'true';
		});
	}
	for (const event of ['dragleave', 'drop'] as const) {
		dropzone.addEventListener(event, (e) => {
			e.preventDefault();
			delete dropzone.dataset.over;
		});
	}
	dropzone.addEventListener('drop', (e) => {
		const file = (e as DragEvent).dataTransfer?.files?.[0];
		if (file) void loadPhoto(file);
	});

	// ---- Alignment --------------------------------------------------------
	function stagePoint(e: PointerEvent | MouseEvent): Point {
		const rect = stage.getBoundingClientRect();
		return {
			x: ((e.clientX - rect.left) / rect.width) * (photo?.width ?? 1),
			y: ((e.clientY - rect.top) / rect.height) * (photo?.height ?? 1),
		};
	}

	stage.addEventListener('click', (e) => {
		if (phase === 'align-left') {
			leftEye = stagePoint(e);
			setPhase('align-right');
		} else if (phase === 'align-right') {
			rightEye = stagePoint(e);
			// Guard against clicking the two eyes in the wrong order.
			if (leftEye && rightEye.x < leftEye.x) [leftEye, rightEye] = [rightEye, leftEye];
			setPhase('ready');
			if (!active) void selectStyle(root.dataset.initialStyle || styles.keys().next().value!);
			render();
		}
	});

	$('realign')?.addEventListener('click', () => {
		leftEye = null;
		rightEye = null;
		setPhase('align-left');
		render();
	});

	// ---- Overlay selection ------------------------------------------------
	async function loadOverlay(src: string): Promise<HTMLImageElement> {
		const cached = overlayCache.get(src);
		if (cached) return cached;
		const img = new Image();
		img.decoding = 'async';
		img.src = src;
		await img.decode();
		overlayCache.set(src, img);
		return img;
	}

	async function selectStyle(id: string): Promise<void> {
		const meta = styles.get(id);
		if (!meta) return;
		active = meta;
		overlay = await loadOverlay(meta.src);
		buildTinted();
		styleLabel.textContent = meta.name;
		for (const button of $$<HTMLButtonElement>('style')) {
			const on = button.dataset.id === id;
			button.setAttribute('aria-pressed', String(on));
			button.dataset.active = on ? 'true' : 'false';
		}
		history.replaceState(null, '', `?style=${id}`);
		render();
	}

	// ---- Controls ---------------------------------------------------------
	const sizeInput = $<HTMLInputElement>('size')!;
	const rotateInput = $<HTMLInputElement>('rotate')!;
	const nudgeInput = $<HTMLInputElement>('nudge')!;
	const opacityInput = $<HTMLInputElement>('opacity')!;

	const readout = (key: string, value: string) => {
		const out = $(`out-${key}`);
		if (out) out.textContent = value;
	};

	function syncControls(): void {
		sizeInput.value = String(Math.round(adjust.scale * 100));
		rotateInput.value = String(Math.round(adjust.rotate));
		nudgeInput.value = String(Math.round(adjust.offsetY));
		opacityInput.value = String(Math.round(opacity * 100));
		readout('size', `${sizeInput.value}%`);
		readout('rotate', `${rotateInput.value}\u00b0`);
		readout('nudge', `${nudgeInput.value}px`);
		readout('opacity', `${opacityInput.value}%`);
		$('flip')?.setAttribute('aria-pressed', String(adjust.flip));
	}

	sizeInput.addEventListener('input', () => {
		adjust.scale = Number(sizeInput.value) / 100;
		syncControls();
		render();
	});
	rotateInput.addEventListener('input', () => {
		adjust.rotate = Number(rotateInput.value);
		syncControls();
		render();
	});
	nudgeInput.addEventListener('input', () => {
		adjust.offsetY = Number(nudgeInput.value);
		syncControls();
		render();
	});
	opacityInput.addEventListener('input', () => {
		opacity = Number(opacityInput.value) / 100;
		syncControls();
		render();
	});
	$('flip')?.addEventListener('click', () => {
		adjust.flip = !adjust.flip;
		syncControls();
		render();
	});
	$('reset')?.addEventListener('click', () => {
		adjust = { ...DEFAULT_ADJUSTMENTS };
		opacity = 1;
		syncControls();
		render();
	});

	for (const button of $$<HTMLButtonElement>('tint')) {
		button.addEventListener('click', () => {
			tint = TINTS.find((t) => t.id === button.dataset.tint) ?? TINTS[0]!;
			for (const other of $$<HTMLButtonElement>('tint')) {
				other.setAttribute('aria-pressed', String(other === button));
				other.dataset.active = other === button ? 'true' : 'false';
			}
			buildTinted();
			render();
		});
	}

	// ---- Direct manipulation ----------------------------------------------
	const pointers = new Map<number, Point>();
	let dragFrom: Point | null = null;
	let pinchFrom: { dist: number; scale: number } | null = null;

	stage.addEventListener('pointerdown', (e) => {
		if (phase !== 'ready') return;
		stage.setPointerCapture(e.pointerId);
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (pointers.size === 1) {
			dragFrom = stagePoint(e);
			stage.style.cursor = 'grabbing';
		} else if (pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			pinchFrom = { dist: Math.hypot(a!.x - b!.x, a!.y - b!.y), scale: adjust.scale };
			dragFrom = null;
		}
	});

	stage.addEventListener('pointermove', (e) => {
		if (phase !== 'ready' || !pointers.has(e.pointerId)) return;
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (pointers.size === 2 && pinchFrom) {
			const [a, b] = [...pointers.values()];
			const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
			adjust.scale = clamp((dist / pinchFrom.dist) * pinchFrom.scale, 0.4, 2.5);
			syncControls();
			render();
			return;
		}
		if (!dragFrom) return;
		const now = stagePoint(e);
		adjust.offsetX += now.x - dragFrom.x;
		adjust.offsetY += now.y - dragFrom.y;
		dragFrom = now;
		syncControls();
		render();
	});

	for (const event of ['pointerup', 'pointercancel', 'pointerleave'] as const) {
		stage.addEventListener(event, (e) => {
			pointers.delete(e.pointerId);
			if (pointers.size < 2) pinchFrom = null;
			if (pointers.size === 0) {
				dragFrom = null;
				if (phase === 'ready') stage.style.cursor = 'grab';
			}
		});
	}

	stage.addEventListener(
		'wheel',
		(e) => {
			if (phase !== 'ready') return;
			e.preventDefault();
			adjust.scale = clamp(adjust.scale * (e.deltaY < 0 ? 1.05 : 0.952), 0.4, 2.5);
			syncControls();
			render();
		},
		{ passive: false },
	);

	// ---- Compare ----------------------------------------------------------
	function applyCompare(): void {
		const pct = Number(compareInput.value);
		canvas.style.clipPath = `inset(0 0 0 ${pct}%)`;
		root.style.setProperty('--compare', `${pct}%`);
	}
	compareInput.addEventListener('input', applyCompare);
	applyCompare();

	// ---- Download ---------------------------------------------------------
	$('download')?.addEventListener('click', () => {
		if (!photo) return;
		const out = document.createElement('canvas');
		out.width = photo.width;
		out.height = photo.height;
		const octx = out.getContext('2d', { alpha: false })!;
		// Scale 1: the export is the same paint() the preview uses, at native size.
		paint(octx, 1);
		out.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `hairstyle-${active?.id ?? 'preview'}.png`;
			// The anchor has to be in the document for the download to fire
			// reliably across browsers; a detached one is silently ignored.
			a.style.display = 'none';
			document.body.append(a);
			a.click();
			setTimeout(() => {
				a.remove();
				URL.revokeObjectURL(url);
			}, 1000);
		}, 'image/png');
	});

	$('change-photo')?.addEventListener('click', () => fileInput.click());

	// ---- Reference image --------------------------------------------------
	const refThreshold = $<HTMLInputElement>('ref-threshold')!;
	const refFeather = $<HTMLInputElement>('ref-feather')!;
	const refPreview = $<HTMLCanvasElement>('ref-preview')!;
	const refApply = $<HTMLButtonElement>('ref-apply')!;
	const refPanel = $('ref-panel')!;
	let refSource: ImageBitmap | null = null;

	/**
	 * Knock out a light background by luminance and feather what is left.
	 * Not segmentation — just a threshold and a blur — but with a clean studio
	 * shot it produces a usable cut-out, and the UI says as much.
	 */
	function keyReference(): void {
		if (!refSource) return;
		const w = refSource.width;
		const h = refSource.height;
		const sharp = document.createElement('canvas');
		sharp.width = w;
		sharp.height = h;
		const sc = sharp.getContext('2d', { willReadFrequently: true })!;
		sc.drawImage(refSource, 0, 0);

		const cut = Number(refThreshold.value);
		if (cut < 100) {
			const data = sc.getImageData(0, 0, w, h);
			const px = data.data;
			const hi = cut * 2.55;
			const lo = hi - 26;
			for (let i = 0; i < px.length; i += 4) {
				const luma = 0.2126 * px[i]! + 0.7152 * px[i + 1]! + 0.0722 * px[i + 2]!;
				if (luma >= hi) px[i + 3] = 0;
				else if (luma > lo) px[i + 3] = Math.round(px[i + 3]! * (1 - (luma - lo) / (hi - lo)));
			}
			sc.putImageData(data, 0, 0);
		}

		const feather = Number(refFeather.value);
		const out = document.createElement('canvas');
		out.width = w;
		out.height = h;
		const oc = out.getContext('2d')!;
		oc.drawImage(sharp, 0, 0);
		if (feather > 0) {
			const mask = document.createElement('canvas');
			mask.width = w;
			mask.height = h;
			const mc = mask.getContext('2d')!;
			mc.filter = `blur(${feather}px)`;
			mc.drawImage(sharp, 0, 0);
			oc.globalCompositeOperation = 'destination-in';
			oc.drawImage(mask, 0, 0);
			oc.globalCompositeOperation = 'source-over';
		}

		refPreview.width = w;
		refPreview.height = h;
		refPreview.getContext('2d')!.drawImage(out, 0, 0);
		refApply.disabled = false;
		refApply.dataset.ready = 'true';
	}

	refInput.addEventListener('change', async () => {
		const file = refInput.files?.[0];
		if (!file?.type.startsWith('image/')) return;
		refSource?.close();
		refSource = await createImageBitmap(file);
		refPanel.dataset.loaded = 'true';
		keyReference();
	});
	refThreshold.addEventListener('input', keyReference);
	refFeather.addEventListener('input', keyReference);

	refApply.addEventListener('click', async () => {
		if (!refApply.dataset.ready) return;
		const url = refPreview.toDataURL('image/png');
		const img = await loadOverlay(url);
		// A reference image carries no anchors, so the placement is a guess:
		// assume the cut-out spans roughly a head's width — about 2.4 eye
		// separations — with the eye line low in the frame, since hair sits
		// above the eyes. It lands close enough to adjust rather than rebuild.
		const meta: StyleMeta = {
			id: 'your-reference',
			name: 'Your reference image',
			src: url,
			leftEye: { x: img.naturalWidth * 0.29, y: img.naturalHeight * 0.78 },
			rightEye: { x: img.naturalWidth * 0.71, y: img.naturalHeight * 0.78 },
		};
		styles.set(meta.id, meta);
		active = meta;
		overlay = img;
		buildTinted();
		styleLabel.textContent = meta.name;
		for (const button of $$<HTMLButtonElement>('style')) {
			button.setAttribute('aria-pressed', 'false');
			button.dataset.active = 'false';
		}
		if (phase === 'ready') render();
	});

	// ---- Boot -------------------------------------------------------------
	const requested = new URLSearchParams(location.search).get('style');
	if (requested && styles.has(requested)) root.dataset.initialStyle = requested;
	const initial = root.dataset.initialStyle;
	if (initial && styles.has(initial)) void selectStyle(initial);

	window.addEventListener('resize', render, { passive: true });
	window.addEventListener('pagehide', () => {
		photo?.close();
		refSource?.close();
		if (photoUrl) URL.revokeObjectURL(photoUrl);
	});

	setPhase('empty');
	syncControls();
}
