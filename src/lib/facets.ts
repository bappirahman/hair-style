/**
 * Editorial copy for the face-shape and hair-type landing pages. Kept here
 * rather than in a collection because each entry is a few paragraphs tied to a
 * fixed taxonomy value, not an authorable document.
 */

import type { FaceShape, HairType } from './taxonomy.ts';

interface Facet {
	title: string;
	tagline: string;
	seoTitle: string;
	seoDescription: string;
	/** How to recognise it, then what follows for hair. */
	body: string[];
	/** Short, concrete guidance shown as a list. */
	rules: string[];
}

export const FACE_SHAPE_CONTENT: Record<FaceShape, Facet> = {
	oval: {
		title: 'Oval face',
		tagline: 'Balanced proportions with a gently rounded jaw — the shape with the fewest constraints.',
		seoTitle: 'Best Hairstyles for an Oval Face',
		seoDescription:
			'Oval faces suit almost every cut. Here is how to tell if yours is oval, and which hairstyles make the most of it rather than simply not clashing.',
		body: [
			'An oval face is a little longer than it is wide, with a forehead marginally broader than the jaw and no hard angles anywhere. The cheekbones are the widest point, and the transition from cheek to jaw is a curve rather than a corner.',
			'Because the proportions are already balanced, an oval face does not need a haircut to correct anything — which is why nearly every style in this catalogue lists it. The useful question shifts from "what suits my face" to "what suits my hair type and my schedule".',
			'The one thing worth avoiding is a heavy fringe that covers most of the forehead. An oval face gets much of its balance from the visible forehead, and burying it can make the face read shorter and rounder than it is.',
		],
		rules: [
			'Almost anything works — choose on hair type and maintenance instead',
			'Keep some forehead visible rather than covering it entirely',
			'Both high and low fades sit well, so pick on how often you can visit a barber',
		],
	},
	round: {
		title: 'Round face',
		tagline: 'Width close to height, with soft edges — cuts that add vertical do the most work.',
		seoTitle: 'Best Hairstyles for a Round Face',
		seoDescription:
			'Round faces suit height on top and short sides. Here is how to identify a round face and which cuts add the vertical it benefits from.',
		body: [
			'A round face is roughly as wide as it is long, widest at the cheeks, with a soft jawline and no strong angles. It reads youthful, and the goal with hair is almost always to introduce length and structure.',
			'Two moves do nearly all the work. Removing width at the sides — a mid or high fade rather than a low one — and adding height on top. A quiff, a pompadour or a textured crop with lift all lengthen the face visually in a way that no product can.',
			'What works against a round face is anything that adds horizontal: a blunt fringe cut level across the forehead, volume at the sides, or a very short uniform cut with no height. Curtains are a notable exception — two vertical panels either side of the face narrow it effectively.',
		],
		rules: [
			'Mid or high fades, not low ones — remove width where the face is widest',
			'Keep height on top: quiffs, pompadours and textured crops all help',
			'Avoid blunt horizontal fringes and side volume',
			'Curtains and middle parts work well despite being longer',
		],
	},
	square: {
		title: 'Square face',
		tagline: 'A strong, angular jaw with a broad forehead — structure worth showing rather than hiding.',
		seoTitle: 'Best Hairstyles for a Square Face',
		seoDescription:
			'Square faces suit cuts that expose the jaw. How to recognise a square face and which hairstyles work with a strong jawline rather than against it.',
		body: [
			'A square face has a jaw roughly as wide as the forehead, with a defined angle where the jaw turns up toward the ear. The overall proportions are close to equal in width and height, but the corners are sharp rather than soft.',
			'This is the shape most cuts are designed around, and the general principle is to expose rather than obscure. Short sides let the jaw read clearly, and swept-back styles put the whole structure on display. A slick back or a medium swept back both work particularly well.',
			'If the jaw feels too severe, softness on top balances it — a textured crop or a wavy quiff introduces movement that offsets the angles without hiding them. What tends not to work is a very heavy, blunt, geometric cut, which doubles down on angularity until the whole head reads as a block.',
		],
		rules: [
			'Short sides let the jaw do the work',
			'Swept-back styles suit the structure especially well',
			'Add softness on top if the angles feel severe: texture rather than bulk',
			'Avoid very heavy blunt shapes that compound the angularity',
		],
	},
	heart: {
		title: 'Heart-shaped face',
		tagline: 'A wide forehead narrowing to a defined chin — balance comes from managing the top.',
		seoTitle: 'Best Hairstyles for a Heart-Shaped Face',
		seoDescription:
			'Heart-shaped faces suit fringes and cuts that reduce forehead width. How to identify the shape and which hairstyles balance it.',
		body: [
			'A heart-shaped face is widest at the forehead and temples and tapers to a narrow, often pointed chin. Cheekbones are usually prominent. The shape is sometimes called an inverted triangle, which describes the proportions accurately.',
			'The useful adjustment is to reduce apparent forehead width and avoid adding volume above it. A fringe does this directly — a French crop, a textured crop or a side-swept fringe all break up the widest part of the face. Keeping some weight at the temples rather than fading them to nothing helps for the same reason.',
			'Tall, wide styles work against it. A large pompadour adds width exactly where the face already has it. Very tight fades at the temple can exaggerate the taper by removing the only thing balancing the chin.',
		],
		rules: [
			'A fringe reduces forehead width more effectively than anything else',
			'Keep some weight at the temples rather than fading them to skin',
			'Avoid tall wide volume on top — it compounds the proportions',
			'Length around the jaw adds welcome weight at the narrow end',
		],
	},
	diamond: {
		title: 'Diamond face',
		tagline: 'Prominent cheekbones with a narrower forehead and chin — width management at the middle.',
		seoTitle: 'Best Hairstyles for a Diamond Face',
		seoDescription:
			'Diamond faces suit cuts that add width at the forehead and keep the sides tight at the cheekbones. Identification and recommended hairstyles.',
		body: [
			'A diamond face is widest at the cheekbones, with a narrower forehead and a narrow chin. It is the least common of the six shapes and often mistaken for oval, though the distinguishing feature is that the forehead is clearly narrower than the cheeks.',
			'The goal is to add a little width at the forehead and keep the sides tight where the face is widest. A fringe with some width, or a textured top with volume, broadens the top of the face. Fades and tapers work well because they remove bulk exactly at the cheekbone.',
			'What tends not to work is anything that adds side volume around the cheeks — long hair tucked behind the ears, or a heavy wavy crop with width at the sides. Very short uniform cuts can also emphasise the cheekbones by removing everything that balanced them.',
		],
		rules: [
			'Keep the sides tight at cheekbone height — fades and tapers suit this well',
			'A fringe or textured volume broadens the narrower forehead',
			'Avoid side volume around the cheeks',
			'Some length at the chin balances the narrow lower face',
		],
	},
	oblong: {
		title: 'Oblong face',
		tagline: 'Noticeably longer than it is wide — width helps, height does not.',
		seoTitle: 'Best Hairstyles for an Oblong or Long Face',
		seoDescription:
			'Oblong faces suit fringes and side volume rather than height. How to recognise a long face and which hairstyles shorten it visually.',
		body: [
			'An oblong face is clearly longer than it is wide, with the forehead, cheeks and jaw at similar widths and a straight rather than tapered outline. It is sometimes called a rectangular or long face.',
			'The rule is the exact inverse of a round face: add width, avoid height. A fringe is the most effective single tool available — a French crop, a Caesar cut or an Edgar cut draws a horizontal line across the forehead that visibly shortens the face. Keeping weight at the sides rather than fading them tight also helps.',
			'Tall styles work against it. A pompadour or a high quiff adds several centimetres of apparent height to a face that already has plenty. High fades have the same effect by narrowing the sides. If you want a fade, keep it low or mid, and consider a drop fade — the downward curve at the back reintroduces a useful horizontal.',
		],
		rules: [
			'A fringe is the most effective correction: French crop, Caesar or Edgar',
			'Keep weight at the sides — low fades and classic tapers rather than high ones',
			'Avoid tall volume on top: pompadours and high quiffs lengthen the face',
			'A drop fade adds a horizontal line at the back that helps',
		],
	},
};

export const HAIR_TYPE_CONTENT: Record<HairType, Facet> = {
	straight: {
		title: 'Straight hair',
		tagline: 'No natural bend — shape comes entirely from the cut and the dryer.',
		seoTitle: 'Best Hairstyles for Straight Hair',
		seoDescription:
			'Straight hair takes a clean shape but provides no texture of its own. The cuts that suit it and the products that make up the difference.',
		body: [
			'Straight hair has no natural bend, which makes it the most precise hair to cut and the least self-supporting to style. A blunt line stays blunt, a fade blends without interruption, and a parting sits exactly where it was combed.',
			'The trade is that straight hair provides no texture on its own. Anything that depends on separation or volume has to be created — with salt spray for grit, a dryer for direction, and clay rather than cream to keep the finish matte.',
			'It is the best hair type for graphic cuts: slick backs, side parts, Caesar cuts and hard-line fades all read cleanest on straight hair. It is the weakest for anything described as "effortless", because the effortless look depends on texture that straight hair does not have.',
		],
		rules: [
			'Best hair type for precise, graphic cuts and clean fades',
			'Salt spray before styling — texture has to be added, not enhanced',
			'Use clay rather than cream to avoid a flat, glossy finish',
			'Direction comes from the dryer, not from the product',
		],
	},
	wavy: {
		title: 'Wavy hair',
		tagline: 'A natural S-bend that most people either fight or ignore.',
		seoTitle: 'Best Hairstyles for Wavy Hair',
		seoDescription:
			'Wavy hair produces texture no product can replicate. The cuts that work with the wave, why not to thin it, and how to air dry it properly.',
		body: [
			'Wavy hair falls in a loose S-bend rather than a coil. It sits between straight and curly and is frequently treated as neither — cut too short to wave, or dried straight with a brush, or thinned until the pattern breaks apart.',
			'Two rules cover most of it. Length: waves need around four centimetres to form a visible bend, so very short cuts lose the texture entirely. And no thinning: thinning shears create short pieces that stick out of the wave pattern and read as frizz rather than movement.',
			'Handled properly, wavy hair produces texture that straight hair needs product to fake. Salt spray on damp hair, scrunch once, then leave it entirely alone while it dries — the touching is what turns waves into frizz.',
		],
		rules: [
			'Keep at least four centimetres or the wave disappears',
			'Never let anyone thin it with thinning shears',
			'Air dry or diffuse — brushing while drying straightens the wave out',
			'Salt spray enhances what is already there; clay flattens it',
		],
	},
	curly: {
		title: 'Curly hair',
		tagline: 'Defined spirals that shrink as they dry — cut dry, or not at all.',
		seoTitle: 'Best Hairstyles for Curly Hair',
		seoDescription:
			'Curly hair should be cut dry because of shrinkage. The cuts that suit curls, how to avoid frizz, and why moisture matters more than styling.',
		body: [
			'Curly hair forms defined spirals and shrinks substantially as it dries — often to half its wet length. That single fact is why curly hair should be cut dry: a barber working on wet curls cannot see the shape they are creating, and the result is consistently shorter and less even than intended.',
			'The second thing worth knowing is that frizz is usually mechanical rather than a moisture problem. Touching curls as they dry, brushing them dry, or drying with a terry towel all disrupt the curl pattern — and a disrupted curl is what frizz is.',
			'Curls pair especially well with faded sides. Curls at the sides of the head grow outward rather than downward, which is what makes curly hair widen at the temples; removing them gives the curls above a clean shape to sit on.',
		],
		rules: [
			'Insist on being cut dry — shrinkage makes wet cutting unpredictable',
			'No thinning shears; they create frizz, not lightness',
			'Apply product to soaking wet hair, scrunch once, then stop touching it',
			'Faded or tapered sides give the curls on top a defined shape',
		],
	},
	coily: {
		title: 'Coily hair',
		tagline: 'Tight, densely packed coils — where moisture and protection matter more than cutting.',
		seoTitle: 'Best Hairstyles for Coily Hair',
		seoDescription:
			'Coily hair needs moisture, shaping and overnight protection. The cuts that suit it, picking without damage, and managing shrinkage.',
		body: [
			'Coily hair forms tight, springy coils packed densely together. It can shrink to a quarter of its stretched length when dry, which makes measuring growth by appearance misleading — length is best judged stretched.',
			'It is also structurally the most prone to dryness of any hair type, because the natural oils produced at the scalp cannot travel down a tightly coiled shaft. Leave-in conditioner is a daily step rather than a treatment, and sealing it with an oil or butter is what keeps it there.',
			'Shape is created by cutting rather than by falling. Hair does not grow evenly, so an even silhouette — an afro, a shaped curly top — is the result of regular shaping every four to six weeks. Overnight protection with a satin durag or pillowcase prevents both breakage and a flattened shape by morning.',
		],
		rules: [
			'Cut dry, always — shrinkage of up to 75% makes wet cutting impossible to judge',
			'Leave-in conditioner daily, sealed with an oil or butter',
			'Pick from the roots outward when moisturised, never dry',
			'A satin durag or pillowcase overnight does more than any product',
		],
	},
	thick: {
		title: 'Thick hair',
		tagline: 'High density that needs weight removed rather than length.',
		seoTitle: 'Best Hairstyles for Thick Hair',
		seoDescription:
			'Thick hair needs internal weight removal, not shorter length. The cuts that manage bulk and stop hair pushing outward at the sides.',
		body: [
			'Thick hair has a high number of strands per square centimetre, which is a different property from coarse hair — you can have fine strands in very high density. What matters practically is that the volume has to go somewhere, and left unmanaged it goes sideways.',
			'The fix is almost always removing weight internally rather than shortening the overall length. A barber cutting thick hair well will thin the interior of the side panels so the hair sits down, while leaving the outline intact. Simply cutting it shorter makes it push out harder.',
			'Thick hair is the best hair type for most structured cuts. Fades read cleanly because there is enough density for a gradient to be visible. Quiffs and pompadours hold because the hair has weight to support itself. The one thing to be careful with is any cut that adds width at the sides.',
		],
		rules: [
			'Ask for internal weight removal, not shorter length',
			'Fades and tapers manage bulk better than uniform cuts',
			'Excellent for quiffs and pompadours — the density holds the shape',
			'Beware cuts that add side volume; thick hair provides plenty already',
		],
	},
	fine: {
		title: 'Fine hair',
		tagline: 'Low density or thin strands — shape and product choice matter more than length.',
		seoTitle: 'Best Hairstyles for Fine or Thinning Hair',
		seoDescription:
			'Fine hair needs blunt cuts, matte products and shapes that do not expose scalp. Practical, honest advice on cuts that work.',
		body: [
			'Fine hair means either thin individual strands, low density, or both. The practical consequence is the same: there is less material to work with, and anything that exposes scalp or weighs the hair down is working against you.',
			'Blunt cuts help, because cutting hair straight across concentrates the visible ends into one line and reads as denser than a textured edge. This is why a French crop or a Caesar cut suits fine hair better than a heavily point-cut textured crop.',
			'Product choice matters more than for any other hair type. Anything heavy or oily flattens fine hair immediately. Volume powder or a pre-styler applied to damp roots before drying gives more lift than any amount of clay applied afterwards, and matte finishes read fuller than glossy ones.',
		],
		rules: [
			'Blunt edges read denser than textured ones',
			'Low fades over high ones — high fades expose more scalp than fine hair can cover',
			'Volume powder at damp roots beats any product applied after drying',
			'Avoid oils, heavy waxes and anything glossy',
		],
	},
};
