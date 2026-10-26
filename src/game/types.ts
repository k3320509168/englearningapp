export interface Question {
  type: string;
  desc: string;
  ans: string;
  speak?: string;
  options?: string[];
  accept?: string[]; 
}

export interface Stage {
  name: string;
  bossMode: boolean;
  questions: Question[];
}