import type { Question } from './types';

export const ADVANCED_REVIEW_READING: Readonly<Partial<Record<number, readonly Question[]>>> = {
  7: [{
    type: 'choice', skill: 'reading',
    desc: 'The library will lend recording kits to community groups. Groups may accept private sponsorship for supplies as long as the sponsor has no control over the recordings. Groups may acknowledge sponsors publicly, but publicity is not a condition of borrowing. A local shop has offered to pay for batteries but wants the right to remove interviews it dislikes. What should the group do if it wants to borrow a kit and accept the offer?',
    options: ['A. Accept the offer because batteries are not part of the recording kit.', 'B. Ask the shop to drop its editorial condition before accepting the offer.', 'C. Keep the condition but omit the shop from the sponsor list.', 'D. Offer the shop the same right after the finished recordings have been submitted.'],
    ans: 'B',
    explain: 'The shop may provide funding, but its proposed veto would give it control over the recordings.',
  }],
  8: [{
    type: 'choice', skill: 'reading',
    desc: 'The housing board described its repair figures as an improvement: half the requests received in April were closed within a week, up from a third in March. A note below the table says contractors began registering urgent calls separately in April and that the April figures exclude those calls. A councillor wants to cite the figures as proof that urgent repair times fell. What is the strongest objection?',
    options: ['A. The difference might reflect a change in the number of contractors rather than their working speed.', 'B. Closing a request might refer to administrative handling rather than the moment the repair was finished.', 'C. The April figures omit the requests needed to support the claim about urgent repairs.', 'D. The April figures should be presented as a count of requests rather than as a proportion.'],
    ans: 'C',
    explain: 'Before testing other explanations for the change, the councillor needs April data on the urgent requests specifically. Those requests are absent from the published figures.',
  }],
  9: [{
    type: 'choice', skill: 'reading',
    desc: 'The editor says the journal will carry letters disputing a reviewer’s judgement, but that a correction will be published only where the review misstates a verifiable feature of the book. An author’s letter argues both that the reviewer’s interpretation is ungenerous and that a chapter the review calls absent is listed in the contents and appears on page 86. The editor accepts the letter and issues a correction confined to the chapter. Which principle best accounts for both decisions?',
    options: ['A. The journal can give interpretive disputes a hearing while reserving corrections for independently verifiable errors.', 'B. A correction should cover the claims whose persuasive force depends on a demonstrably false statement.', 'C. Publishing a response can fulfil the journal’s duty to correct a factual error when the letter supplies the evidence.', 'D. A journal should publish a dispute only when at least one of its claims meets the standard for a correction.'],
    ans: 'A',
    explain: 'The editor distinguishes allowing an argument to be heard from correcting the inaccurate claim about the chapter.',
  }],
};
