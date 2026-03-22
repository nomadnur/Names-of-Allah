#!/usr/bin/env python3
"""
Merge Ghazali insights into names.json.
Sources:
  1. ghazali_extracted.json — OCR-extracted counsel text (26 names, needs cleanup)
  2. notebooklm_insights dict below — manually gathered from NotebookLM (24 names)
"""

import json, re
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
SCRIPTS_DIR = Path(__file__).parent

# ─── OCR cleanup ────────────────────────────────────────────────────────────
# The PDF OCR inserts spaces inside words at syllable/letter boundaries.
# We fix the most common patterns with ordered regex substitutions.

OCR_FIXES = [
    # Remove "Counsel:" prefix
    (r'^Counsel:\s*', ''),
    # Common split-word patterns — order matters (longer patterns first)
    (r'\bs in ce\b', 'since'),
    (r'\bb in d\b', 'bind'),
    (r'\bk in d\b', 'kind'),
    (r'\bm in d\b', 'mind'),
    (r'\bf in d\b', 'find'),
    (r'\bh in d\b', 'hind'),
    (r'\bbl in d\b', 'blind'),
    (r'\bb in g\b', 'bing'),
    (r'\bw in g\b', 'wing'),
    (r'\br in g\b', 'ring'),
    (r'\bs in g\b', 'sing'),
    (r'\bth in g\b', 'thing'),
    (r'\bb in \b', 'bin'),
    (r'\b(\w+) in g\b', r'\1ing'),   # creat in g → creating, etc.
    (r'\b(\w+) in \b', r'\1in'),
    (r'\bw or d\b', 'word'),
    (r'\bw or k\b', 'work'),
    (r'\bw or ld\b', 'world'),
    (r'\bw or th\b', 'worth'),
    (r'\bw or ship\b', 'worship'),
    (r'\bf or \b', 'for '),
    (r'\bm or e\b', 'more'),
    (r'\bb or e\b', 'bore'),
    (r'\bst or e\b', 'store'),
    (r'\bb or n\b', 'born'),
    (r'\bch or e\b', 'chore'),
    (r'\bex is t\b', 'exist'),
    (r'\bex is tence\b', 'existence'),
    (r'\bex is t in g\b', 'existing'),
    (r'\bcons is t\b', 'consist'),
    (r'\bcons is ts\b', 'consists'),
    (r'\bpers is t\b', 'persist'),
    (r'\bres is t\b', 'resist'),
    (r'\bass is t\b', 'assist'),
    (r'\bbe in g\b', 'being'),
    (r'\batta in\b', 'attain'),
    (r'\bre in \b', 'rein'),
    (r'\bma in \b', 'main'),
    (r'\baga in\b', 'again'),
    (r'\brem in d\b', 'remind'),
    (r'\bdes is e\b', 'desire'),
    (r'\bdes is es\b', 'desires'),
    (r'\bdes is re\b', 'desire'),
    (r'\bpr or \b', 'pro'),
    (r'\bpr is e\b', 'prise'),
    (r'\bpra is e\b', 'praise'),
    (r'\bpra is ed\b', 'praised'),
    (r'\bpra is ew or thy\b', 'praiseworthy'),
    (r'\bsa in t\b', 'saint'),
    (r'\bsa in ts\b', 'saints'),
    (r'\bpo in t\b', 'point'),
    (r'\bpo in ts\b', 'points'),
    (r'\bjo in \b', 'join'),
    (r'\bin tentionally\b', 'intentionally'),
    (r'\bin tention\b', 'intention'),
    (r'\bin ter\b', 'inter'),
    (r'\bin terior\b', 'interior'),
    (r'\bin ternal\b', 'internal'),
    (r'\bin tegrate\b', 'integrate'),
    (r'\bin tegrates\b', 'integrates'),
    (r'\bin tegrat in g\b', 'integrating'),
    (r'\bin ward\b', 'inward'),
    (r'\bsupport in g\b', 'supporting'),
    (r'\bsupp or t\b', 'support'),
    (r'\bsupp or t in g\b', 'supporting'),
    (r'\babas in g\b', 'abasing'),
    (r'\bexalt in g\b', 'exalting'),
    (r'\bguard in g\b', 'guarding'),
    (r'\bpetit in g\b', 'petitioning'),
    (r'\bpetit ion\b', 'petition'),
    (r'\bguid in g\b', 'guiding'),
    (r'\bhapp in ess\b', 'happiness'),
    (r'\bhapp in esses\b', 'happinesses'),
    (r'\bconc is eness\b', 'conciseness'),
    (r'\bpr in ce\b', 'prince'),
    (r'\bpr in ciple\b', 'principle'),
    (r'\bpr in ciples\b', 'principles'),
    (r'\bgentleness\b', 'gentleness'),
    (r'\bglor ious\b', 'glorious'),
    (r'\bgl or ious\b', 'glorious'),
    (r'\bgl or y\b', 'glory'),
    (r'\bg or ious\b', 'gorious'),
    (r'\bh is \b', 'his '),
    (r'\bth is \b', 'this '),
    (r'  +', ' '),   # collapse multiple spaces
]

def clean_ocr(text: str) -> str:
    if not text:
        return ''
    text = text.strip()
    for pattern, repl in OCR_FIXES:
        text = re.sub(pattern, repl, text)
    # Trim to first ~600 chars (counsel paragraphs) then clean sentence boundary
    if len(text) > 700:
        text = text[:700]
        # Cut at last full stop
        last_dot = text.rfind('.')
        if last_dot > 400:
            text = text[:last_dot + 1]
    return text.strip()


# ─── NotebookLM-sourced insights (24 names) ─────────────────────────────────
NOTEBOOKLM_INSIGHTS = {
    # Batch 1 results
    17: "A person's share in this name lies in diligently preserving their heart and limbs from sin. This requires protecting one's faith from the destructive assaults of anger, the enticements of worldly desires, self-deception, and the delusions of Satan. By maintaining this strict vigilance, a believer guards themselves against the perils that lead to spiritual perdition.",
    26: "A person earns a portion of this name by developing a deep, experiential awareness of their own inner world — their heart and body. This involves recognizing the heart's hidden flaws, such as its capacity for deception, treachery, and false sincerity. By adopting watchful vigilance against the ruses of the lower self, a believer embodies the essence of being fully aware.",
    44: "Al-Ghazali counsels that the pursuit of knowledge is only praiseworthy when it draws one closer to God. True knowledge is that which deepens one's understanding of Him and facilitates knowing Him more fully; any other worldly knowledge holds little spiritual distinction by comparison.",
    48: "A person can only attain a figurative share of this attribute by becoming completely free from needing anything other than God. While absolute independence belongs solely to God, a human achieves their highest realization of this name when they successfully detach from worldly dependencies, ensuring that their only remaining need is God Himself.",
    77: "A person shares in this name by actively expanding their knowledge and developing a vast, accommodating character. This requires expanding one's heart so that it is no longer confined by restrictive and negative traits — such as the fear of poverty, the anger that accompanies envy, or the dominance of greed.",
    # Batch 2 results
    86: "Allah is the Lord and Master who nurtures and rectifies the affairs of all creation through the continuous favours He showers upon them. A believer recognises Him as the sovereign owner who alone creates, controls, provides for, and guides His servants.",
    87: "This name highlights Allah's absolute gentleness with His servants and in all of His actions. This divine gentleness is perfectly reflected in how He created the universe in deliberate stages, entirely in accordance with His infinite wisdom.",
    88: "This name points to the One who is supremely venerated and rightfully declared completely free from any deficiency or flaw. It represents a state of absolute divine perfection, which is why the noble angels continually venerate Him.",
    89: "This name denotes that Allah is the absolute owner and master of the entire universe. It is a profound reminder that all creation are His devoted servants who remain in a state of absolute and total need of Him.",
    90: "Allah alone can remove pain and harm from the hearts and bodies of His servants. True healing is exclusively in His hands — He cures whomever He wills, and none can cure except Him.",
    91: "This name denotes the One who is absolutely perfect and rightfully free from any deficiency or shortcoming. It guides believers to recognise and revere the flawless purity inherent in Allah's essence and in all His actions.",
    97: "Allah is the ultimate bestower who provides to whomever is deserving of His gifts. This name teaches the believer to recognise Allah as the sole source of all provision and to rely upon Him to fulfil their every need.",
    99: "Allah is the absolutely unique One who has no partner, helper, or equal. He is singular in His self, His attributes, and His actions — deepening the believer's understanding of His peerless oneness.",
    # Names partially covered but with enough to write an insight
    42: "Al-Ghazali explains this name as an essence that completely transcends the limits of human perception and imagination. Its true tremendousness is beyond what the eye or the human intellect can capture — the believer's only response is awe and humility before what cannot be fully grasped.",
    45: "Al-Ghazali explains that absolute, eternal exaltedness belongs solely to God. While all other things may be 'above' something comparatively, only God is above everything necessarily and without qualification — the believer therefore seeks elevation through closeness to Him, not through rank among creation.",
    # Batch 4a — previously missing
    16: "Al-Haseeb is the Reckoner who preserves the deeds of creation to hold them to account, while also being the ultimate source of sufficiency for His servants. A believer realises this attribute by understanding that God alone is the measure of all things and the only One who truly suffices, teaching complete reliance upon Him for all physical and spiritual necessities.",
    20: "Al-Mubeen is the Evident One whose existence, Lordship, and right to be worshipped are an unquestionable certainty. His reality is demonstrated through a multitude of clear proofs and signs placed throughout creation, more evident than the midday sun. He is also the One who clearly illuminates the path of salvation and success for His creation.",
    25: "Al-Qayyoom is the Self-Subsisting Sustainer who has absolutely no need of anything, while everything in existence utterly depends on Him. Al-Ghazali notes that a believer gains a spiritual share of this attribute by detaching from reliance on anything other than God, recognising that He alone supports and suffices all of creation in both prosperous and difficult times.",
    38: "Ash-Shaheed is the Universal Witness from whom absolutely nothing is absent, perfectly observing both the apparent and hidden realities of existence. He witnesses all external actions and will ultimately bear witness to mankind's deeds on the Day of Resurrection. This attribute reminds the believer to remain constantly mindful, knowing that their every action and secret is seen by God.",
    55: "Al-Qawiyy is the One who is absolutely perfect in His strength and fully capable of accomplishing anything He wills. Because His power is supreme and complete, no force can overcome Him and no one can repel or alter His divine decrees. Recognising this attribute fills the believer with awe and complete reliance on God's invincible might.",
    61: "Al-Muta'aalee signifies the Supreme and Exalted One who is elevated far above His creation in His power, His essence, and His sovereign control. He is completely free from any likeness to creation, earthly characteristics, or false claims invented against Him. Understanding this name grounds the believer in the absolute transcendence and incomparable majesty of God.",
    66: "Al-Muheet is the All-Encompassing One who completely surrounds and enumerates all of creation through His infinite knowledge and absolute power. He encompasses every existing thing with His boundless mercy and His ultimate subjugation. This awareness teaches the believer that absolutely nothing in the universe can escape God's grasp or His perfect oversight.",
    # Batch 4b
    69: "Al-Muqeet is the Creator who delivers physical nourishment to bodies and spiritual sustenance to hearts. A person can metaphorically attain a share of this attribute by acting as a means of care and sufficiency for others, yet must ultimately recognise they are merely an instrument — true and absolute sufficiency comes only from God.",
    72: "Al-Mawlaa is the supreme Master and Supporter who provides aid to all of creation, and specifically guides and defends the believers against their enemies. Understanding this name teaches the believer to rely entirely on Him, trusting that He is the Lord who actively causes whatever is truly beneficial to reach His devoted servants.",
    74: "An-Naseer is the divine Helper who secures ultimate victory for the believers and casts terror into the hearts of their adversaries. Recognising this attribute gives the believer immense courage, knowing that God alone makes their feet firm and grants success when they face opposition.",
    79: "Al-Wakeel is the all-encompassing Guardian who perfectly suffices anyone who places their complete trust and reliance in Him. The believer finds profound peace in depending on this Trustworthy Disposer, knowing He faithfully executes all entrusted matters through His boundless knowledge and supreme power.",
    80: "Al-Waliyy is the protective patron who loves, guides, and grants success to the believers. A person gains a spiritual share of this name by loving God and His allies, and by steadfastly opposing His enemies — which begins with fighting against the destructive inclinations of one's own lower self and Satan.",
    83: "Al-Jawaad is the Munificent One whose limitless generosity covers all of existence, giving liberally even to those who obstinately reject Him. Reflecting on this boundless generosity inspires the believer to eagerly anticipate the unimaginable delights He has prepared for His faithful servants in paradise.",
    85: "Al-Hayyiyu signifies the One who possesses honourable shame and graciously disdains to ever leave a supplicating servant empty-handed. This profound attribute reassures the believer that God's extensive mercy and forbearance will cause Him to gently cover and pardon their faults, rather than exposing them to disgrace.",
    # Batch 4c
    2: "Al-Ahad is the Unique One who is completely alone and singular in every possible sense. Understanding this name reminds the believer that Allah has no equal or partner in His self, His attributes, or His absolute divinity.",
    4: "Al-Akram is the Most Generous whose perfect and boundless generosity has no equal. Reflecting on this name teaches the believer to recognise the unmatched abundance of Allah's favours and to seek all their needs exclusively from His limitless bounty.",
    5: "Al-Ilaah signifies the true Deity who alone holds the absolute right to be worshipped by all of creation. Acknowledging this name centres the believer's life entirely around devoting all acts of worship, love, and submission exclusively to Him.",
    28: "Al-Khallaaq is the continuous Creator for whom bringing anything into existence repeatedly is completely effortless. This attribute reassures the believer of Allah's boundless creative power, reminding them that no situation or restoration is too difficult for Him to manifest.",
    54: "Al-Qareeb is the Near One who intimately draws close to the hearts of those who worship Him and make supplication to Him. Recognising this immense closeness brings profound comfort to the believer, knowing that Allah encompasses and witnesses everything while remaining near to His servants.",
    96: "Al-Muhsin is the One who acts with absolute excellence, ensuring that all of His actions and decrees are flawlessly perfect. This name instils deep trust in the believer, teaching them to recognise the inherent goodness and fine manner in everything Allah ordains.",
    98: "Al-Mannaan is the Beneficent Bestower from whom every single favour, blessing, and gift ultimately originates. Reflecting on this name fills the believer with immense gratitude, acknowledging that every good in their life is a direct, unearned bounty generously granted by Him alone.",
}


# ─── Main merge ─────────────────────────────────────────────────────────────
def main():
    names_path = DATA_DIR / 'names.json'
    extracted_path = SCRIPTS_DIR / 'ghazali_extracted.json'

    with open(names_path) as f:
        names = json.load(f)

    with open(extracted_path) as f:
        extracted = json.load(f)

    extracted_by_index = {e['matched_index']: e for e in extracted if e.get('matched_index')}

    updated = 0
    skipped_already_has = 0
    skipped_no_content = 0

    for name in names:
        idx = name['index']

        # Skip if already has a good insight
        if name.get('ghazali_insight') and str(name.get('ghazali_insight', '')).strip():
            skipped_already_has += 1
            continue

        insight = None

        # Priority 1: NotebookLM-sourced insights
        if idx in NOTEBOOKLM_INSIGHTS:
            insight = NOTEBOOKLM_INSIGHTS[idx]

        # Priority 2: OCR-extracted counsel (cleaned)
        elif idx in extracted_by_index:
            e = extracted_by_index[idx]
            counsel = e.get('extracted_counsel', '') or ''
            if counsel.strip():
                cleaned = clean_ocr(counsel)
                if len(cleaned) > 60:  # only use if substantial
                    insight = cleaned

        if insight:
            name['ghazali_insight'] = insight
            updated += 1
            print(f"  ✅ {idx}. {name['transliteration']}")
        else:
            skipped_no_content += 1
            print(f"  ⬜ {idx}. {name['transliteration']} — no content available")

    print(f"\nUpdated: {updated}, Already had insight: {skipped_already_has}, No content: {skipped_no_content}")

    # Validate
    assert len(names) == 99, "Must still have 99 names"

    with open(names_path, 'w', encoding='utf-8') as f:
        json.dump(names, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Saved to {names_path}")

    # Final audit
    filled = sum(1 for n in names if n.get('ghazali_insight') and str(n.get('ghazali_insight', '')).strip())
    print(f"ghazali_insight coverage: {filled}/99")


if __name__ == '__main__':
    main()
