/**
 * Game file format is:
 * var rounds = [
 *   [<question>,<color>,<answer>],
 *   ["Green","#0000FF","blue"],
 *   ...
 * ]
 * <answer> may be comma separated
 * 
 */

var num_examples = 2;
var num_trials = 15;
var focus_delay = 1500;
var focus_icon = "+";
var focus_icon_color = "#FFFFFF";
var mid_round_delay = 2500;

function initialize() {
  num_examples = rounds[0][1].length;
  loadVariablesFromURL()
  loadVariables()
  
  
  $("#instructions_link").click(popup_instructions);
  $("#continue_button").click(done_instructions);  
  $("#done_button").click(quitButton);
  $("#answer").keydown(answer_keydown);
  $("#continue_button").fadeIn();
}

function loadVariables(){
     //  try { if ("num_examples" in variables) num_examples=parseInt(variables["num_examples"]); } catch (err) {}
  try { if ("num_trials" in variables) num_trials=parseInt(variables["num_trials"]); } catch (err) {}
  try { if ("focus_delay" in variables) focus_delay=parseInt(variables["focus_delay"]); } catch (err) {}
  try { if ("focus_icon" in variables) focus_icon=variables["focus_icon"]; } catch (err) {}
  try { if ("focus_icon_color" in variables) focus_icon_color=variables["focus_icon_color"]; } catch (err) {}
  try { if ("mid_round_delay" in variables) mid_round_delay=parseInt(variables["mid_round_delay"]); } catch (err) {}
}
function loadVariablesFromURL(){
    var url = new URL(window.location.href);
    for (const [key, value] of Object.entries(variables)) {
      if (url.searchParams.get(key) != null){
          variables[key]=url.searchParams.get(key)
      }
    }
}

function popup_instructions() {
  var pi = $("#popup_instructions");
  if (pi.is(':visible')) {
    pi.fadeOut();    
  } else {
    pi.fadeIn();    
  }
}

function done_instructions() {
  $("#instructions").fadeOut(function() { loadExampleRound(1); });
//  $("#instructions").fadeOut(function() { loadTrialRound(1) });
}

var in_example = true;
function loadExampleRound(rnd) {
  setRound(rnd);
  in_example = true;
  
  var round = rounds[0][1][rnd-1]; // group 0 is the instructions, item 1 is the list, [rnd-1] is the item
  loadRound(rnd,"Example",rnd,num_examples,round[0],round[1],round[2]);
}

function loadTrialRound(rnd) {
  setRound(rnd+100);
  in_example = false;
  
  // group[0] is the probability that the group should be chosen
  // group[1] is the list of choices
  
  // Step 1: Choose the Group based on the group's probability
  var group_rnd = Math.random();
  var group = null;
  var prob_sum = 0;
  for (grp_idx in rounds) {
    if (grp_idx > 0) {
      group = rounds[grp_idx];
      prob_sum+=group[0];
      if (group_rnd < prob_sum) {
        break;
      }
    }
  }
  
  // Step 2: Choose an element of the group
  var ridx = Math.floor(Math.random()*group[1].length);
  var round = group[1][ridx];
  loadRound(rnd+100,"Trial",rnd,num_trials,round[0],round[1],round[2]);
}

var FOCUS = 1;
var TYPING = 2;
var ANSWERED = 3;

var flash_timer = null;
var cur_question = null;
var cur_color = null;
var cur_answer = null;
var mode = 0;
function loadRound(internal_round_number, title, rnd_num, total_rnds,question,color,answer) {
  cur_question = question;
  cur_color = color;
  cur_answer = answer;
  $(".beginRoundHide").hide();
  $("#question").html(focus_icon);
  $("#question").css("color",focus_icon_color);
  $("#round_display").html(title+" "+rnd_num+"/"+total_rnds);
  $("#round_display").fadeIn();
  $("#answer").val("");  
  $("#question").show();
  $("#answer").show();
  $("#answer").focus();
  mode = FOCUS;
  flash_timer = setTimeout(show_question, focus_delay);
}

var startTime = null;
var firstLetterTime = null;
var stopTime = null;
var reactionTime = null;
var totalTime = null;
function show_question() {
  firstLetterTime = null;
  var q = $("#question");
  q.html(cur_question);
  q.css("color",cur_color);
  startTime = new Date().getTime();
  $("#answer").focus();
  mode=TYPING;
  if (in_example) {
    $("#hint").fadeIn();
  }
}

function answer_keydown(e) {
  if (mode!=TYPING) {
    return false;
  }
  if (e.keyCode === 8) { // backspace
    return false;
  }  
  if (e.keyCode === 32) { // space
    answerComplete();
    return false;
  }
  if (e.keyCode === 13) { // enter
    answerComplete();
    return false;
  }
  if (e.keyCode === 16) { // shift
    return true;
  }
  if (e.keyCode >= 65 && e.keyCode <= 90 && !firstLetterTime) {
    firstLetterTime=new Date().getTime();
    setTimeout(answerComplete,1);
    return true;
  }
//  alert(e.keyCode);
}

var numCorrect = 0;
var numIncorrect = 0;
var totalReactionTime = 0;

function answerComplete() {
  if (!firstLetterTime) { // in case they don't make an answer
    firstLetterTime=new Date().getTime();
  }
  stopTime = new Date().getTime();
  mode = ANSWERED;
  answer = $("#answer").val();
  reactionTime = firstLetterTime-startTime;
  totalTime = stopTime-startTime;
//  alert(reactionTime);
  
  var correct = false;
  if (cur_answer.indexOf(answer.toLowerCase()) != -1) {
    var cur_answers = cur_answer.split(",");
//    alert(cur_answers);
    for (i in cur_answers) {
      if (answer.toLowerCase() == cur_answers[i]) {
        correct = true;
        break;
      }
    }
  }
  submit('<reaction word="'+cur_question+'" color="'+cur_color+'" answer="'+answer+'" reaction="'+reactionTime+'" total="'+totalTime+'" />');
  
  $("#hint").fadeOut();
  if (correct) {
    correctAnswer();
  } else {
    incorrectAnswer();
  }
  setTimeout(startNextRound,mid_round_delay);
}

function incorrectAnswer() {
  $("#incorrect").fadeIn();  
  if (in_example) {
    currentRound--;
    setTimeout(function() {
      $("#hint_txt").html("Type in '"+cur_answer.split(",")[0]+"'");    
      $("#try_again").fadeIn();    
    }, 1000);
  } else {
    totalReactionTime+=reactionTime;
    numIncorrect++;
  }
}

function correctAnswer() {
  $("#correct").fadeIn();
  if (in_example) {
    setTimeout(function() {
      $("#hint_txt").html('Enter the <i>middle letter</i> and press the "space" bar.');    
    }, 1000);
  } else {
    totalReactionTime+=reactionTime;
    numCorrect++;
  }
}

function startNextRound() {
  if (currentRound == num_examples) {
    loadTrialRound(1);
    return;
  }
  if (currentRound < num_examples) {
    loadExampleRound(currentRound+1);
    return;
  }
  if (currentRound == num_trials+100) {
    showScoreScreen();
    return;
  }
  loadTrialRound(currentRound-99);
}

function showScoreScreen() {
  $(".beginRoundHide").fadeOut();
  $("#question").fadeOut();
  $("#answer").fadeOut(showScoreScreenHelper);  
}

function showScoreScreenHelper() {
  var fraction_correct = Math.ceil(100*numCorrect/num_trials);
  var ave_response_time = Math.floor(totalReactionTime/num_trials);
  
  if (ave_response_time < 0) {
    alert(totalReactionTime+" "+num_trials);
  }
  
  $("#percent_correct").html(fraction_correct+"%");
  $("#ave_response").html(ave_response_time);
  $("#score_screen").fadeIn();
  
  experimentComplete();
  parent.postMessage('end study','*');
}
