"use strict";

const OPTION = (label, index) => ({ id: `opt-${index + 1}`, label: String(label) });

function choiceQuestion({ questionId, subtopicId, difficulty, indicatorIds, misconceptionCodes, prompt, options, mathExpressions, correctIndex, contentKind = "curated", generation = {} }) {
  const optionList = options.map((label, index) => OPTION(label, index));
  return {
    question: {
      schemaVersion: "1.0",
      questionId,
      contentKind,
      questionType: "single_choice",
      status: "published",
      educationLevel: "SMP",
      grade: 7,
      phase: "D",
      subject: "matematika",
      topicId: "aljabar",
      subtopicId,
      difficulty,
      indicatorIds,
      misconceptionCodes,
      content: { prompt, options: optionList, mathExpressions: mathExpressions.map((source) => ({ source })), context: null, media: [] },
      evaluationRef: null,
      generation,
      version: { contentVersion: "1.0" },
    },
    correctOptionId: optionList[correctIndex].id,
  };
}

const curated = [
  choiceQuestion({ questionId:"alg-cur-001", subtopicId:"variabel", difficulty:"easy", indicatorIds:["concept"], misconceptionCodes:["ALG_VARIABLE_CONFUSION"], prompt:"Pada bentuk $3x + 5$, manakah yang merupakan variabel?", options:["3","x","5","8"], mathExpressions:["3x + 5"], correctIndex:1 }),
  choiceQuestion({ questionId:"alg-cur-002", subtopicId:"variabel", difficulty:"easy", indicatorIds:["concept"], misconceptionCodes:["ALG_VARIABLE_CONFUSION"], prompt:"Jika $x=4$, berapakah nilai $2x$?", options:["2","4","6","8"], mathExpressions:["x=4","2x"], correctIndex:3 }),
  choiceQuestion({ questionId:"alg-cur-005", subtopicId:"koefisien-konstanta", difficulty:"easy", indicatorIds:["concept"], misconceptionCodes:["ALG_COEFF_CONST_CONFUSION"], prompt:"Pada $6x+4$, berapakah koefisien $x$?", options:["4","6","10","x"], mathExpressions:["6x+4"], correctIndex:1 }),
  choiceQuestion({ questionId:"alg-cur-006", subtopicId:"koefisien-konstanta", difficulty:"easy", indicatorIds:["concept"], misconceptionCodes:["ALG_COEFF_CONST_CONFUSION"], prompt:"Pada $5y-9$, konstanta adalah ...", options:["5","y","-9","9y"], mathExpressions:["5y-9"], correctIndex:2 }),
  choiceQuestion({ questionId:"alg-cur-009", subtopicId:"suku-sejenis", difficulty:"easy", indicatorIds:["concept"], misconceptionCodes:["ALG_LIKE_TERM_CONFUSION"], prompt:"Manakah pasangan suku yang sejenis?", options:["$2x$ dan $3x$","$2x$ dan $3y$","$2x$ dan $3$","$x^2$ dan $x$"], mathExpressions:["2x","3x"], correctIndex:0 }),
  choiceQuestion({ questionId:"alg-cur-010", subtopicId:"suku-sejenis", difficulty:"easy", indicatorIds:["concept"], misconceptionCodes:["ALG_LIKE_TERM_CONFUSION"], prompt:"Manakah yang bukan suku sejenis dengan $5a$?", options:["$2a$","$-3a$","$7a$","$5b$"], mathExpressions:["5a"], correctIndex:3 }),
  choiceQuestion({ questionId:"alg-cur-011", subtopicId:"suku-sejenis", difficulty:"medium", indicatorIds:["procedure"], misconceptionCodes:["ALG_LIKE_TERM_CONFUSION"], prompt:"Sederhanakan $2x+5x$.", options:["$7x$","$10x$","$7$","$2x^5$"], mathExpressions:["2x+5x"], correctIndex:0 }),
  choiceQuestion({ questionId:"alg-cur-012", subtopicId:"suku-sejenis", difficulty:"medium", indicatorIds:["procedure"], misconceptionCodes:["ALG_LIKE_TERM_CONFUSION","ALG_COEFFICIENT_OPERATION_ERROR"], prompt:"Sederhanakan $8y-3y$.", options:["$5y$","$11y$","$5$","$24y$"], mathExpressions:["8y-3y"], correctIndex:0 }),
  choiceQuestion({ questionId:"alg-cur-013", subtopicId:"suku-sejenis", difficulty:"hard", indicatorIds:["representation","procedure"], misconceptionCodes:["ALG_LIKE_TERM_CONFUSION"], prompt:"Bentuk paling sederhana dari $3a+2b+4a$ adalah ...", options:["$7a+2b$","$9ab$","$7a+6b$","$3a+6b$"], mathExpressions:["3a+2b+4a"], correctIndex:0 }),
  choiceQuestion({ questionId:"alg-cur-014", subtopicId:"operasi-bentuk-aljabar", difficulty:"easy", indicatorIds:["procedure"], misconceptionCodes:["ALG_LIKE_TERM_CONFUSION"], prompt:"Sederhanakan $4x+2+3x$.", options:["$7x+2$","$7x+5$","$12x+2$","$4x+5$"], mathExpressions:["4x+2+3x"], correctIndex:0 }),
  choiceQuestion({ questionId:"alg-cur-015", subtopicId:"operasi-bentuk-aljabar", difficulty:"medium", indicatorIds:["procedure"], misconceptionCodes:["ALG_SIGN_OPERATION_ERROR"], prompt:"Sederhanakan $6x-4x+3$.", options:["$2x+3$","$10x+3$","$2x-3$","$24x+3$"], mathExpressions:["6x-4x+3"], correctIndex:0 }),
  choiceQuestion({ questionId:"alg-cur-021", subtopicId:"plsv", difficulty:"easy", indicatorIds:["procedure"], misconceptionCodes:["ALG_EQUATION_BALANCE_ERROR"], prompt:"Tentukan $x$: $x+4=9$.", options:["4","5","9","13"], mathExpressions:["x+4=9"], correctIndex:1 }),
  choiceQuestion({ questionId:"alg-cur-022", subtopicId:"plsv", difficulty:"medium", indicatorIds:["procedure"], misconceptionCodes:["ALG_EQUATION_BALANCE_ERROR","ALG_SIGN_OPERATION_ERROR"], prompt:"Tentukan $x$: $x-3=8$.", options:["5","8","11","24"], mathExpressions:["x-3=8"], correctIndex:2 }),
  choiceQuestion({ questionId:"alg-cur-027", subtopicId:"soal-cerita-aljabar", difficulty:"medium", indicatorIds:["problem_solving","representation"], misconceptionCodes:["ALG_STORY_TRANSLATION_ERROR"], prompt:"Dina memiliki $x$ buku. Ia mendapat 4 buku lagi sehingga memiliki 11 buku. Persamaan yang tepat adalah ...", options:["$x-4=11$","$x+4=11$","$4x=11$","$x+11=4"], mathExpressions:["x+4=11"], correctIndex:1 }),
  choiceQuestion({ questionId:"alg-cur-029", subtopicId:"soal-cerita-aljabar", difficulty:"hard", indicatorIds:["problem_solving"], misconceptionCodes:["ALG_STORY_TRANSLATION_ERROR"], prompt:"Harga sebuah buku adalah $x$ rupiah. Dua buku dan biaya sampul Rp2.000 berjumlah Rp12.000. Persamaan yang tepat adalah ...", options:["$2x+2000=12000$","$2x-2000=12000$","$x+2000=12000$","$2(x+2000)=12000"], mathExpressions:["2x+2000=12000"], correctIndex:0 }),
];

function generatedVariableValue() { const x=7, add=5; return choiceQuestion({questionId:`gen-variable-${x}-${add}`,subtopicId:"variabel",difficulty:"easy",indicatorIds:["concept"],misconceptionCodes:["ALG_VARIABLE_CONFUSION"],prompt:`Jika nilai $x$ adalah ${x}, berapakah nilai $x + ${add}$?`,options:[x+add,x-add,x*add,x],mathExpressions:[`x = ${x}`,`x + ${add}`],correctIndex:0,contentKind:"generated",generation:{generatorId:"algebra.variable-value",generatorVersion:"1.0"}}); }
function generatedCoefficient() { const c=6,k=4; return choiceQuestion({questionId:`gen-coefficient-${c}-${k}`,subtopicId:"koefisien-konstanta",difficulty:"easy",indicatorIds:["concept"],misconceptionCodes:["ALG_COEFF_CONST_CONFUSION"],prompt:`Pada bentuk $${c}x + ${k}$, berapakah koefisien $x$?`,options:[c,k,c+k,c-1],mathExpressions:[`${c}x + ${k}`],correctIndex:0,contentKind:"generated",generation:{generatorId:"algebra.coefficient-identification",generatorVersion:"1.0"}}); }
function generatedLikeTerms() { const a=2,b=5; return choiceQuestion({questionId:`gen-like-terms-${a}-${b}`,subtopicId:"suku-sejenis",difficulty:"easy",indicatorIds:["procedure"],misconceptionCodes:["ALG_LIKE_TERM_CONFUSION","ALG_COEFFICIENT_OPERATION_ERROR"],prompt:`Sederhanakan $${a}x + ${b}x$.`,options:[`${a+b}x`,`${a*b}x`,`${a+b}`,`${a}x + ${b}`],mathExpressions:[`${a}x + ${b}x`],correctIndex:0,contentKind:"generated",generation:{generatorId:"algebra.like-terms",generatorVersion:"1.0"}}); }
function generatedLinear() { const a=3,b=4,c=2,d=5; return choiceQuestion({questionId:`gen-linear-op-${a}-${b}-${c}-${d}`,subtopicId:"operasi-bentuk-aljabar",difficulty:"medium",indicatorIds:["procedure","representation"],misconceptionCodes:["ALG_LIKE_TERM_CONFUSION","ALG_COEFFICIENT_OPERATION_ERROR"],prompt:`Sederhanakan $${a}x + ${b} + ${c}x + ${d}$.`,options:[`${a+c}x + ${b+d}`,`${a+c}x + ${b-d}`,`${a*c}x + ${b+d}`,`${a+c}x + ${b-d}`],mathExpressions:[`${a}x + ${b} + ${c}x + ${d}`],correctIndex:0,contentKind:"generated",generation:{generatorId:"algebra.linear-combination",generatorVersion:"1.0"}}); }
function generatedPlsv() { const x=7,add=5; return choiceQuestion({questionId:`gen-plsv-${x}-${add}`,subtopicId:"plsv",difficulty:"medium",indicatorIds:["procedure"],misconceptionCodes:["ALG_EQUATION_BALANCE_ERROR","ALG_SIGN_OPERATION_ERROR"],prompt:`Tentukan nilai $x$ yang memenuhi persamaan $x + ${add} = ${x+add}$.`,options:[x,x+add,x-add,add],mathExpressions:[`x + ${add} = ${x+add}`],correctIndex:0,contentKind:"generated",generation:{generatorId:"algebra.plsv-addition",generatorVersion:"1.0"}}); }
function generatedSubtraction() { const a=8,b=3,c=2; return choiceQuestion({questionId:`gen-linear-sub-${a}-${b}-${c}`,subtopicId:"operasi-bentuk-aljabar",difficulty:"medium",indicatorIds:["procedure"],misconceptionCodes:["ALG_LIKE_TERM_CONFUSION","ALG_SIGN_OPERATION_ERROR"],prompt:`Sederhanakan $${a}x + ${b} - ${c}x$.`,options:[`${a-c}x + ${b}`,`${a+c}x + ${b}`,`${a-c}x - ${b}`,`${a*c}x + ${b}`],mathExpressions:[`${a}x + ${b} - ${c}x`],correctIndex:0,contentKind:"generated",generation:{generatorId:"algebra.linear-subtraction",generatorVersion:"1.0"}}); }
function generatedDistributive() { const k=3,a=4,b=2; return choiceQuestion({questionId:`gen-distributive-${k}-${a}-${b}`,subtopicId:"operasi-bentuk-aljabar",difficulty:"medium",indicatorIds:["procedure","representation"],misconceptionCodes:["ALG_DISTRIBUTIVE_ERROR"],prompt:`Sederhanakan $${k}(${a}x+${b})$.`,options:[`${k*a}x + ${k*b}`,`${k*a}x + ${b}`,`${a}x + ${k*b}`,`${k+a}x + ${k+b}`],mathExpressions:[`${k}(${a}x+${b})`],correctIndex:0,contentKind:"generated",generation:{generatorId:"algebra.distributive",generatorVersion:"1.0"}}); }
function generatedMul() { const k=3,x=6,total=18; return choiceQuestion({questionId:`gen-plsv-mul-${k}-${x}`,subtopicId:"plsv",difficulty:"medium",indicatorIds:["procedure"],misconceptionCodes:["ALG_EQUATION_BALANCE_ERROR"],prompt:`Tentukan nilai $x$: $${k}x=${total}$.`,options:[x,k,total,total+k],mathExpressions:[`${k}x=${total}`],correctIndex:0,contentKind:"generated",generation:{generatorId:"algebra.plsv-multiplication",generatorVersion:"1.0"}}); }
function generatedDifference() { const x=12,s=5; return choiceQuestion({questionId:`gen-variable-difference-${x}-${s}`,subtopicId:"variabel",difficulty:"easy",indicatorIds:["concept","procedure"],misconceptionCodes:["ALG_VARIABLE_CONFUSION","ALG_SIGN_OPERATION_ERROR"],prompt:`Jika $x=${x}$, berapakah nilai $x-${s}$?`,options:[x-s,x+s,x*s,s],mathExpressions:[`x=${x}`,`x-${s}`],correctIndex:0,contentKind:"generated",generation:{generatorId:"algebra.variable-difference",generatorVersion:"1.0"}}); }

const generated = [generatedVariableValue, generatedCoefficient, generatedLikeTerms, generatedLinear, generatedPlsv, generatedSubtraction, generatedDistributive, generatedMul, generatedDifference];

function storyBooks(){return choiceQuestion({questionId:"story-books-7-5",subtopicId:"soal-cerita-aljabar",difficulty:"easy",indicatorIds:["problem_solving","concept"],misconceptionCodes:["ALG_STORY_TRANSLATION_ERROR"],prompt:"Doni memiliki $x$ buku. Ia mendapat 5 buku lagi sehingga jumlahnya menjadi 12. Berapakah nilai $x$?",options:[7,2,35,5],mathExpressions:["x + 5 = 12"],correctIndex:0,contentKind:"story-template",generation:{templateId:"algebra.story-books",templateVersion:"1.0"}});}
function storyAge(){return choiceQuestion({questionId:"story-age-11-4",subtopicId:"soal-cerita-aljabar",difficulty:"medium",indicatorIds:["problem_solving","representation"],misconceptionCodes:["ALG_STORY_TRANSLATION_ERROR"],prompt:"Usia kakak 4 tahun lebih tua dari adiknya. Jika usia kakak 15 tahun dan usia adik dinyatakan $x$, berapakah nilai $x$?",options:[11,15,4,19],mathExpressions:["x + 4 = 15"],correctIndex:0,contentKind:"story-template",generation:{templateId:"algebra.story-age",templateVersion:"1.0"}});}
function storyPrice(){return choiceQuestion({questionId:"story-price-3-4000",subtopicId:"soal-cerita-aljabar",difficulty:"medium",indicatorIds:["problem_solving","representation"],misconceptionCodes:["ALG_STORY_TRANSLATION_ERROR"],prompt:"Harga satu buku adalah $x$ rupiah. Jika membeli 3 buku dengan harga Rp4.000 per buku, berapa total harganya?",options:[12000,4000,8000,4003],mathExpressions:["3x","x=4000"],correctIndex:0,contentKind:"story-template",generation:{templateId:"algebra.story-price",templateVersion:"1.0"}});}
function storyQuantity(){return choiceQuestion({questionId:"story-quantity-4-3",subtopicId:"soal-cerita-aljabar",difficulty:"easy",indicatorIds:["problem_solving","concept"],misconceptionCodes:["ALG_STORY_TRANSLATION_ERROR"],prompt:"Sebuah toko menata 4 kotak. Setiap kotak berisi 3 buku. Jika banyak buku dinyatakan sebagai $4x$ saat $x=3$, berapa jumlah buku seluruhnya?",options:[12,7,9,16],mathExpressions:["4x","x=3"],correctIndex:0,contentKind:"story-template",generation:{templateId:"algebra.story-multiplication",templateVersion:"1.0"}});}
function storyPerimeter(){return choiceQuestion({questionId:"story-perimeter-8-5",subtopicId:"soal-cerita-aljabar",difficulty:"hard",indicatorIds:["problem_solving","representation"],misconceptionCodes:["ALG_STORY_TRANSLATION_ERROR"],prompt:"Panjang sebuah persegi panjang adalah $8$ cm dan lebarnya $5$ cm. Jika panjang dinyatakan $x$ dan lebar dinyatakan $y$, berapakah kelilingnya?",options:[26,13,40,21],mathExpressions:["2x+2y","x=8","y=5"],correctIndex:0,contentKind:"story-template",generation:{templateId:"algebra.story-perimeter",templateVersion:"1.0"}});}
function storyPlsv(){return choiceQuestion({questionId:"story-plsv-9-6",subtopicId:"soal-cerita-aljabar",difficulty:"medium",indicatorIds:["problem_solving","representation"],misconceptionCodes:["ALG_STORY_TRANSLATION_ERROR","ALG_EQUATION_BALANCE_ERROR"],prompt:"Rani memiliki sejumlah pensil. Setelah membeli 6 pensil lagi, jumlahnya menjadi 15. Jika banyak pensil mula-mula dinyatakan dengan $x$, berapakah nilai $x$?",options:[9,6,15,21],mathExpressions:["x + 6 = 15"],correctIndex:0,contentKind:"story-template",generation:{templateId:"algebra.story-plsv-addition",templateVersion:"1.0"}});}

const stories = [storyPlsv, storyBooks, storyAge, storyPrice, storyQuantity, storyPerimeter];

function shuffle(items) { const out = items.slice(); for (let i=out.length-1;i>0;i-=1){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out; }
function publicQuestion(bundle){ const q=JSON.parse(JSON.stringify(bundle.question)); delete q.fingerprint; delete q.evaluationRef; return q; }

function createPractice() {
  const selected = shuffle([
    ...generated.slice(0, 5).map((make) => make()),
    ...shuffle(curated).slice(0, 3),
    ...stories.slice(0, 2).map((make) => make()),
  ]);
  return selected.map((bundle) => ({ question: publicQuestion(bundle), correctOptionId: bundle.correctOptionId }));
}

function evaluate(questionId, answer) {
  const all = [
    ...curated,
    ...generated.map((make) => make()),
    ...stories.map((make) => make()),
  ];
  const bundle = all.find((item) => item.question.questionId === questionId);
  if (!bundle) return null;
  return { isCorrect: String(answer) === String(bundle.correctOptionId), evaluationCode: String(answer) === String(bundle.correctOptionId) ? "CORRECT" : "INCORRECT", misconceptionCode: String(answer) === String(bundle.correctOptionId) ? null : (bundle.question.misconceptionCodes?.[0] || null) };
}

module.exports = { createPractice, evaluate };
