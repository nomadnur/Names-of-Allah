#!/usr/bin/env python3
"""
Fill bahasa_meaning, salah_usage, dhikr_usage for the 37 names missing these fields.
Format reference from existing entries:
  bahasa_meaning: "Yang Maha ..." (short Malay)
  salah_usage: 1 English sentence — practical salah guidance
  dhikr_usage: 1-2 sentences — Malay invocation + benefit
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"

ENTRIES = {
    1: {
        "bahasa_meaning": "Yang Maha Agung",
        "salah_usage": "Begin every rakaat with the awareness that you stand before Allah — the name that encompasses all His attributes.",
        "dhikr_usage": "Sebut 'Ya Allah' dengan penuh khusyuk dalam setiap zikir agar hati sentiasa terikat kepada-Nya.",
    },
    3: {
        "bahasa_meaning": "Yang Maha Tinggi",
        "salah_usage": "Lower your gaze and humble your heart in ruku and sujud, remembering that He is above all in rank and majesty.",
        "dhikr_usage": "Zikirkan Ya Al-A'laa ketika merasa sombong agar hati kembali sedar akan keagungan-Nya yang tiada tanding.",
    },
    4: {
        "bahasa_meaning": "Yang Maha Mulia",
        "salah_usage": "Recite this Name in your salah to remember that all honour and generosity flow from Him alone.",
        "dhikr_usage": "Sebut Ya Al-Akram dalam doa selepas solat agar hati sentiasa bergantung kepada kemurahan-Nya yang tiada had.",
    },
    5: {
        "bahasa_meaning": "Yang Berhak Disembah",
        "salah_usage": "Let every takbir renew your conviction that your salah is owed to Him alone — the only one deserving worship.",
        "dhikr_usage": "Zikirkan Ya Al-Ilaah untuk memperbaharui niat dan keikhlasan dalam setiap amal ibadah.",
    },
    8: {
        "bahasa_meaning": "Yang Maha Nyata",
        "salah_usage": "Stand in salah knowing He is above all and manifest over all creation — let this awareness deepen your focus.",
        "dhikr_usage": "Sebut Ya Adh-Dhaahir ketika hati ragu agar yakin bahawa Allah nyata atas segala-galanya.",
    },
    15: {
        "bahasa_meaning": "Yang Maha Memelihara",
        "salah_usage": "Pray each salah as an act of gratitude to the One who preserves your life, faith, and wellbeing without ceasing.",
        "dhikr_usage": "Zikirkan Ya Al-Haafidh setiap hari agar sedar bahawa Allah sahaja yang memelihara iman dan kehidupan kita.",
    },
    17: {
        "bahasa_meaning": "Yang Maha Menjaga",
        "salah_usage": "Seek Allah's guardianship over your heart and limbs before each salah, trusting He guards what you cannot.",
        "dhikr_usage": "Sebut Ya Al-Hafeedh dalam zikir pagi dan petang sebagai permohonan perlindungan daripada kelalaian dan dosa.",
    },
    18: {
        "bahasa_meaning": "Yang Maha Mengetahui Keadaan Hamba",
        "salah_usage": "Pray with the certainty that He is fully aware of your unseen struggles — your salah is heard completely.",
        "dhikr_usage": "Zikirkan Ya Al-Hafiyy ketika merasai kesusahan yang tidak diketahui orang lain agar hati tenteram dengan ilmu-Nya.",
    },
    20: {
        "bahasa_meaning": "Yang Maha Jelas",
        "salah_usage": "Reflect in salah that Allah's signs are clearer than the midday sun — let this clarity sharpen your focus on Him.",
        "dhikr_usage": "Sebut Ya Al-Mubeen ketika berdepan dengan kekeliruan agar Allah menerangi hati dan memberikan petunjuk yang jelas.",
    },
    28: {
        "bahasa_meaning": "Yang Maha Pencipta",
        "salah_usage": "Praise Allah in sujud for His endless creative power — the One who creates and recreates without fatigue.",
        "dhikr_usage": "Zikirkan Ya Al-Khallaaq ketika berhadapan dengan permulaan baru agar sedar bahawa Allah mampu mencipta jalan yang tidak terduga.",
    },
    36: {
        "bahasa_meaning": "Yang Maha Menghargai",
        "salah_usage": "Let every salah be an act of gratitude, knowing Allah appreciates every sincere effort however small.",
        "dhikr_usage": "Sebut Ya Ash-Shaakir selepas melakukan kebaikan agar hati ikhlas dan tidak mengharapkan penghargaan selain daripada-Nya.",
    },
    40: {
        "bahasa_meaning": "Yang Maha Mengetahui",
        "salah_usage": "Enter salah knowing He knows all you have done and all you intend — let this awareness bring both humility and sincerity.",
        "dhikr_usage": "Zikirkan Ya Al-'Aalim ketika ragu tentang sesuatu perkara agar hati tenang bahawa Allah mengetahui apa yang tersembunyi.",
    },
    44: {
        "bahasa_meaning": "Yang Maha Mengetahui Segalanya",
        "salah_usage": "Recite this Name before salah to remind yourself that He knows your heart's condition before you speak a word.",
        "dhikr_usage": "Sebut Ya Al-'Aleem dalam setiap zikir agar sentiasa sedar tiada rahsia yang tersembunyi daripada pengetahuan-Nya.",
    },
    45: {
        "bahasa_meaning": "Yang Maha Tinggi Darjat-Nya",
        "salah_usage": "In ruku and sujud, reflect on His absolute exaltedness above all creation — let this move you to deeper reverence.",
        "dhikr_usage": "Zikirkan Ya Al-'Aliyy ketika merasa rendah diri agar sedar bahawa kemuliaan hakiki hanya milik Allah.",
    },
    50: {
        "bahasa_meaning": "Yang Maha Berkuasa",
        "salah_usage": "Stand in salah knowing that the One you face holds absolute power over all things in existence.",
        "dhikr_usage": "Sebut Ya Al-Qaadir ketika merasa lemah dan tidak berdaya agar hati berserah kepada kekuasaan-Nya yang mutlak.",
    },
    51: {
        "bahasa_meaning": "Yang Maha Memaksa",
        "salah_usage": "Enter salah with submission, knowing that all things are subdued beneath His irresistible power.",
        "dhikr_usage": "Zikirkan Ya Al-Qaahir ketika berhadapan dengan musuh atau kesulitan agar hati yakin bahawa Allah mengatasi segala-galanya.",
    },
    53: {
        "bahasa_meaning": "Yang Maha Mampu",
        "salah_usage": "Make du'a after salah with full conviction — He is Al-Qadeer, fully capable of answering every need.",
        "dhikr_usage": "Sebut Ya Al-Qadeer dalam istikharah dan doa hajat agar hati yakin Allah berkuasa memenuhi setiap keperluan.",
    },
    54: {
        "bahasa_meaning": "Yang Maha Dekat",
        "salah_usage": "Whisper your du'a after sujud knowing He is nearer to you than you are to yourself.",
        "dhikr_usage": "Zikirkan Ya Al-Qareeb ketika berasa sunyi dan jauh agar hati sedar Allah lebih dekat daripada urat leher.",
    },
    61: {
        "bahasa_meaning": "Yang Maha Mulia Lagi Tinggi",
        "salah_usage": "Enter salah with a heart emptied of arrogance, standing before the One who is supremely exalted above all.",
        "dhikr_usage": "Sebut Ya Al-Muta'aalee untuk merendahkan hati dan mengingatkan diri bahawa keagungan hakiki hanya layak bagi-Nya.",
    },
    66: {
        "bahasa_meaning": "Yang Maha Meliputi",
        "salah_usage": "Pray knowing that He encompasses your every thought, action, and secret — nothing escapes His knowledge.",
        "dhikr_usage": "Zikirkan Ya Al-Muheet ketika berasa terasing agar sedar bahawa Allah meliputi segala sesuatu dengan ilmu dan kuasa-Nya.",
    },
    71: {
        "bahasa_meaning": "Yang Maha Merajai",
        "salah_usage": "Stand in salah as a servant before the true King — the One whose sovereignty over all creation is absolute.",
        "dhikr_usage": "Sebut Ya Al-Maleek untuk mengukuhkan keyakinan bahawa segala urusan dunia dan akhirat di bawah pemerintahan-Nya.",
    },
    72: {
        "bahasa_meaning": "Yang Maha Melindungi",
        "salah_usage": "Seek Allah's patronage in salah, knowing He is the ultimate Protector who never abandons those who turn to Him.",
        "dhikr_usage": "Zikirkan Ya Al-Mawlaa ketika berasa tidak berdaya agar hati teguh dengan keyakinan bahawa Allah adalah sebaik-baik pelindung.",
    },
    74: {
        "bahasa_meaning": "Yang Maha Penolong",
        "salah_usage": "Make du'a in salah knowing He is An-Naseer — the Helper who grants victory to those who strive sincerely for His sake.",
        "dhikr_usage": "Sebut Ya An-Naseer ketika menghadapi tekanan dan cabaran agar hati yakin pertolongan Allah pasti datang pada masa yang tepat.",
    },
    80: {
        "bahasa_meaning": "Yang Maha Melindungi Orang Beriman",
        "salah_usage": "Let your salah deepen your love for Allah — He is Al-Waliyy, the Guardian who loves and protects the believers.",
        "dhikr_usage": "Zikirkan Ya Al-Waliyy untuk memperkukuh hubungan dengan Allah agar sentiasa berada di bawah perlindungan dan keredaan-Nya.",
    },
    82: {
        "bahasa_meaning": "Yang Maha Indah",
        "salah_usage": "Beautify your salah with sincerity and presence, honouring the One whose beauty is beyond all description.",
        "dhikr_usage": "Sebut Ya Al-Jameel dalam zikir agar hati menghargai keindahan ciptaan Allah dan sentiasa bersyukur atas nikmat-Nya.",
    },
    83: {
        "bahasa_meaning": "Yang Maha Pemurah",
        "salah_usage": "Ask freely in salah — He is Al-Jawaad, whose generosity encompasses even those who turn away from Him.",
        "dhikr_usage": "Zikirkan Ya Al-Jawaad ketika memohon hajat agar hati yakin bahawa kemurahan Allah meliputi semua hamba-Nya tanpa sempadan.",
    },
    85: {
        "bahasa_meaning": "Yang Memiliki Sifat Malu Yang Mulia",
        "salah_usage": "Approach salah with humility knowing He will never leave a sincere supplicant empty-handed out of His noble forbearance.",
        "dhikr_usage": "Sebut Ya Al-Hayyiyu ketika memohon keampunan agar hati yakin Allah terlalu mulia untuk membiarkan hamba-Nya kembali hampa.",
    },
    86: {
        "bahasa_meaning": "Yang Maha Memelihara dan Mentarbiyah",
        "salah_usage": "Begin each salah recognising His constant nurturing of your life, faith, and every breath you draw.",
        "dhikr_usage": "Zikirkan Ya Ar-Rabb untuk memperbaharui rasa syukur atas tarbiyah Allah yang berterusan dalam setiap aspek kehidupan.",
    },
    87: {
        "bahasa_meaning": "Yang Maha Lembut",
        "salah_usage": "Approach salah gently, knowing Allah is Ar-Rafeeq — He created the universe with deliberate gentleness and wisdom.",
        "dhikr_usage": "Sebut Ya Ar-Rafeeq dalam doa agar dianugerahkan kelembutan dalam hati, pertuturan, dan pergaulan sesama manusia.",
    },
    88: {
        "bahasa_meaning": "Yang Maha Suci daripada Segala Kekurangan",
        "salah_usage": "Glorify Him in ruku with Subhaana Rabbiyal 'Adheem, honouring the One whom the angels ceaselessly venerate.",
        "dhikr_usage": "Zikirkan Subboohun Quddoos ketika bertasbih agar hati sentiasa menyucikan Allah daripada segala sifat yang tidak layak bagi-Nya.",
    },
    89: {
        "bahasa_meaning": "Yang Maha Berkuasa dan Mulia",
        "salah_usage": "Stand in salah as a devoted servant before the absolute Master of all — let this awareness remove all false pride.",
        "dhikr_usage": "Sebut Ya As-Sayyid untuk memperkukuh rasa kehambaan agar hati sedar bahawa kita adalah hamba yang sentiasa memerlukan-Nya.",
    },
    90: {
        "bahasa_meaning": "Yang Maha Menyembuhkan",
        "salah_usage": "Supplicate in salah for healing of the heart and body, trusting that true cure belongs to Him alone.",
        "dhikr_usage": "Zikirkan Ya Ash-Shaafee ketika sakit atau ditimpa kesusahan agar hati berserah kepada-Nya sebagai satu-satunya penyembuh yang hakiki.",
    },
    91: {
        "bahasa_meaning": "Yang Maha Baik dan Suci",
        "salah_usage": "Purify your intention before salah, knowing that He is At-Tayyib — the Pure One who accepts only what is pure.",
        "dhikr_usage": "Sebut Ya At-Tayyib sebelum berdoa agar hati bersih daripada riya' dan niat yang tidak ikhlas kepada-Nya.",
    },
    96: {
        "bahasa_meaning": "Yang Maha Berbuat Baik",
        "salah_usage": "Perform your salah with excellence (ihsan), knowing that Al-Muhsin sees and appreciates every perfect detail of your worship.",
        "dhikr_usage": "Zikirkan Ya Al-Muhsin untuk mengingatkan diri bahawa Allah mahu kita berbuat baik dalam setiap perkara, sekecil mana pun.",
    },
    97: {
        "bahasa_meaning": "Yang Maha Pemberi",
        "salah_usage": "Ask abundantly in salah — He is Al-Mu'tee, the Giver whose treasure is never diminished by giving.",
        "dhikr_usage": "Sebut Ya Al-Mu'tee dalam doa selepas solat agar hati sentiasa mengharapkan pemberian-Nya dan tidak bergantung kepada selain-Nya.",
    },
    98: {
        "bahasa_meaning": "Yang Maha Pemberi Nikmat",
        "salah_usage": "Count His blessings in salah, recognising that every good you have is an unearned gift from Al-Mannaan.",
        "dhikr_usage": "Zikirkan Ya Al-Mannaan sebagai ungkapan syukur agar hati sentiasa sedar bahawa segala nikmat adalah anugerah percuma dari-Nya.",
    },
    99: {
        "bahasa_meaning": "Yang Maha Ganjil, Tiada Tandingan",
        "salah_usage": "Pray Witr as its namesake — the odd-numbered salah honouring the One who is uniquely singular with no partner.",
        "dhikr_usage": "Zikirkan Ya Al-Witr dalam solat witir agar hati sentiasa mengakui keesaan Allah yang mutlak dan tiada sebarang sekutu bagi-Nya.",
    },
}


def main():
    names_path = DATA_DIR / 'names.json'
    with open(names_path) as f:
        names = json.load(f)

    updated = 0
    for name in names:
        idx = name['index']
        if idx not in ENTRIES:
            continue
        entry = ENTRIES[idx]
        changed = False
        for field in ('bahasa_meaning', 'salah_usage', 'dhikr_usage'):
            if not name.get(field) or not str(name.get(field, '')).strip():
                name[field] = entry[field]
                changed = True
        if changed:
            updated += 1
            print(f"  ✅ {idx:2d}. {name['transliteration']}")

    print(f"\nUpdated: {updated}")
    assert len(names) == 99

    with open(names_path, 'w', encoding='utf-8') as f:
        json.dump(names, f, ensure_ascii=False, indent=2)
    print(f"✅ Saved to {names_path}")

    # Audit
    for field in ('bahasa_meaning', 'salah_usage', 'dhikr_usage'):
        filled = sum(1 for n in names if n.get(field) and str(n.get(field, '')).strip())
        print(f"  {field}: {filled}/99")


if __name__ == '__main__':
    main()
