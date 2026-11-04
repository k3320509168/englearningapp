import fs from 'fs';
import path from 'path';

const bankDir = 'src/game/questions/bank';

const REPLACEMENTS: Record<string, Record<string, { meaning: string; example: string; exampleZh: string }>> = {
  'r0': {
    'STILL WATER PLEASE': {
      meaning: '常溫水，謝謝',
      example: 'Could we have two glasses of still water, please?',
      exampleZh: '可以請你給我們兩杯常溫水嗎？'
    }
  },
  'r1': {
    'FOR TAKEOUT PLEASE': {
      meaning: '麻煩外帶',
      example: 'I would like two coffees for takeout, please.',
      exampleZh: '我想要兩杯咖啡外帶，謝謝。'
    }
  },
  'r2': {
    'DONT HAVE TO': {
      meaning: '不需要、不必',
      example: 'You don\'t have to pay for the Wi-Fi; it is completely free.',
      exampleZh: '你不需要支付 Wi-Fi 費用，它是完全免費的。'
    },
    'DONT NEED TO': {
      meaning: '不需要、不必',
      example: 'We booked tickets online, so we don\'t need to stand in line.',
      exampleZh: '我們已經在網路上訂票了，所以不需要排隊。'
    },
    'THURSDAY AT 215 PM': {
      meaning: '週四下午兩點十五分',
      example: 'The project briefing is scheduled for Thursday at 2:15 PM.',
      exampleZh: '專案簡報安排在週四下午兩點十五分舉行。'
    }
  },
  'r3': {
    'WILL LOSE': {
      meaning: '將會失去',
      example: 'If you do not update your privacy settings, you will lose control of your data.',
      exampleZh: '如果你不更新隱私設定，你將會失去對資料的掌控權。'
    },
    'HAS BEEN SEEN': {
      meaning: '已被看見、已被瀏覽',
      example: 'Her new profile picture has been seen by thousands of followers.',
      exampleZh: '她的新個人頭像已經被數千名追蹤者看過了。'
    },
    'WILL TAKE': {
      meaning: '將會搭乘、將會耗費',
      example: 'If there is a traffic jam, we will take the subway instead.',
      exampleZh: '如果塞車，我們就會改搭地鐵。'
    },
    'WILL BRING': {
      meaning: '將會帶來',
      example: 'The summer music festival will bring many visitors to our town.',
      exampleZh: '夏季音樂節將會為我們城鎮帶來許多遊客。'
    },
    'WERE DONATED': {
      meaning: '被捐贈',
      example: 'Hundreds of warm winter coats were donated to local charities.',
      exampleZh: '數百件保暖冬衣被捐贈給了當地的慈善機構。'
    },
    'WILL BECOME': {
      meaning: '將會成為',
      example: 'With steady technological progress, renewable energy will become much cheaper.',
      exampleZh: '隨著科技的持續進步，再生能源將會變得更加便宜。'
    },
    'WILL BE DELETED': {
      meaning: '將會被刪除',
      example: 'Inactive accounts will be deleted after ninety days without notice.',
      exampleZh: '未使用的閒置帳號將會在九十天後被刪除，恕不另行通知。'
    },
    'WILL SUFFER': {
      meaning: '將會受損、將會受苦',
      example: 'Without sufficient rest and sleep, your mental health will suffer.',
      exampleZh: '如果沒有充足的休息與睡眠，你的心理健康將會受損。'
    },
    'WILL NOT ENTER': {
      meaning: '將不會進入',
      example: 'Workers who do not wear a safety helmet will not enter the construction site.',
      exampleZh: '未佩戴安全帽的工人將不得進入施工現場。'
    },
    'WAS WRITTEN': {
      meaning: '被撰寫',
      example: 'This classic detective novel was written by a famous local author.',
      exampleZh: '這本經典偵探小說是由一位當地知名作家所撰寫的。'
    },
    'WAS DESTROYED': {
      meaning: '被摧毀',
      example: 'The ancient stone castle was destroyed during the civil war centuries ago.',
      exampleZh: '這座古老的石造城堡在數百年前的內戰中被摧毀了。'
    },
    'WILL NOT BE': {
      meaning: '將不會是、將不會被',
      example: 'Food products that contain artificial chemicals will not be approved for sale.',
      exampleZh: '含有化學人工添加物的食品將不會被批准販售。'
    },
    'WILL BE': {
      meaning: '將會是、將會',
      example: 'If you park in this reserved lane, your car will be towed immediately.',
      exampleZh: '如果你停在這個專用車道，你的車輛將會立刻被拖吊。'
    },
    'TO AVOID CONFUSING CUSTOMERS': {
      meaning: '為了避免使顧客困惑',
      example: 'The store updated its return policy labels to avoid confusing customers.',
      exampleZh: '這家商店更新了退換貨政策標籤，以避免使顧客困惑。'
    }
  }
};

for (const [r, dict] of Object.entries(REPLACEMENTS)) {
  const filePath = path.join(bankDir, `vocab-${r}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let count = 0;
  for (const [key, patch] of Object.entries(dict)) {
    if (data[key]) {
      data[key].meaning = patch.meaning;
      data[key].example = patch.example;
      data[key].exampleZh = patch.exampleZh;
      count++;
    }
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Updated ${count} items in vocab-${r}.json`);
}

console.log('✅ 所有機械例句替換完畢！');
