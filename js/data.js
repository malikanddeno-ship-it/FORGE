(()=>{'use strict';const F=window.FORGE=window.FORGE||{};
F.VERSION='4.0.0';F.SAVE_KEY='forge-overdrive-v4';F.DB_NAME='forge-clips-v4';
F.GAMES={vrfs:{id:'vrfs',name:'VRFS',color:'#55d8ff',icon:'◈'},valorant:{id:'valorant',name:'VALORANT',color:'#ff5f70',icon:'V'}};
F.DIFFICULTIES={easy:{name:'STANDARD',mult:1},medium:{name:'HARD',mult:1.3},hard:{name:'OVERDRIVE',mult:1.65}};
F.QUESTS={
vrfs:[
['ironWall','Iron Wall','Finish a match with a defensive clip you are proud of.','DEFENSE','easy',130,8],
['lastLine','Last Line','Clip a clutch save that prevents a clear goal.','SAVE','medium',180,11],
['lockdown','Lockdown','Win a possession by tackling or intercepting, then keep the play alive.','TACKLE','medium',190,12],
['counterSpark','Counter Spark','Turn a defensive win into a dangerous counterattack in the same sequence.','COUNTER','hard',250,15],
['cleanExit','Clean Exit','Receive pressure near your goal and play out without giving the ball away.','COMPOSURE','medium',185,11],
['threadNeedle','Thread the Needle','Create a scoring chance with a pass through pressure.','PASS','medium',190,12],
['assistLine','Creator','Record a clip where your pass directly creates a goal.','ASSIST','hard',250,16],
['finish','Cold Finish','Score a clean goal and clip the entire build-up.','GOAL','medium',200,12],
['distance','Long Range','Score or create a dangerous shot from long range.','RANGE','hard',245,15],
['airControl','Air Control','Win an aerial ball or make a useful aerial touch under pressure.','AERIAL','hard',255,16],
['recovery','Recovery Run','Lose a duel, recover, and make the next defensive play.','RECOVERY','medium',185,11],
['oneTouch','One Touch','Use a one-touch pass or finish that keeps the move flowing.','TECHNIQUE','medium',200,12],
['pressure','Press Breaker','Escape a press with control and keep possession.','COMPOSURE','hard',240,15],
['teamMove','Team Move','Clip a multi-pass team sequence that ends in a shot or goal.','TEAMPLAY','medium',205,13],
['heroMoment','Hero Moment','Capture one play that changes the momentum of the match.','CLUTCH','hard',275,18],
['keeperLaunch','Launch Sequence','Start a dangerous attack from a save or defensive recovery.','TRANSITION','medium',195,12],
['deny','Denied','Stop a clear scoring chance without conceding immediately after.','DEFENSE','hard',245,15],
['calm','Ice Cold','Make a composed play while being heavily pressured near your own goal.','COMPOSURE','hard',250,15]
],
valorant:[
['firstBlood','Opening Pick','Get first blood and clip the round from the setup through the kill.','FIRST BLOOD','medium',190,12],
['twoPiece','Two Piece','Get a clean 2K in one round.','MULTIKILL','medium',190,12],
['triple','Triple Threat','Get a 3K or better in one round.','MULTIKILL','hard',260,17],
['clutch','Clutch Signal','Win a 1v2 or harder clutch.','CLUTCH','hard',290,20],
['utility','Utility Value','Use utility that directly helps secure a kill, plant, defuse, or site take.','UTILITY','medium',195,12],
['anchor','Site Anchor','Hold your site through pressure and survive the fight.','DEFENSE','hard',245,15],
['retake','Retake','Win a retake and clip the full sequence.','RETAKE','hard',250,16],
['entryTrade','Trade Protocol','Trade a teammate quickly after they are eliminated.','TEAMPLAY','medium',180,11],
['headshot','Clean Tap','Get a clean headshot kill and clip the setup, not just the final second.','AIM','easy',145,9],
['patient','Hold the Line','Win a fight by holding an angle instead of over-pushing.','DISCIPLINE','easy',150,9],
['plant','Objective First','Help secure a plant and survive long enough to influence post-plant.','OBJECTIVE','medium',190,12],
['defuse','Defuse Pressure','Secure or meaningfully protect a defuse under pressure.','OBJECTIVE','hard',240,15],
['eco','Eco Damage','Make a high-impact play on a low-buy or eco round.','ECONOMY','medium',205,13],
['antiFlash','Reset Fight','Avoid or recover from enemy utility and still win the fight.','REACTION','hard',235,15],
['support','Support Win','Set up a teammate with utility or positioning that wins the engagement.','TEAMPLAY','medium',185,11],
['discipline','No Throw','Back out of a bad fight and later win the round or next engagement.','DISCIPLINE','medium',175,10],
['aceThreat','Ace Threat','Get four kills in a round.','MULTIKILL','hard',310,22],
['infoPlay','Read & React','Use information to reposition and win the next fight.','GAME SENSE','medium',205,13]
]};
F.BOSS_QUESTS={vrfs:[
['vrfsBoss1','The Fortress','Create a clip containing two meaningful defensive actions in the same sequence, ending with your team safely in possession.',420,30],
['vrfsBoss2','End-to-End','Start or join a transition from your defensive half that ends in a goal.',450,32],
['vrfsBoss3','Match Saver','Capture a late or high-pressure defensive play that directly protects a lead or tie.',470,34]
],valorant:[
['valBoss1','Round Thief','Win a disadvantaged round through a clutch, multikill, or huge utility play.',450,32],
['valBoss2','Site Breaker','Be part of a successful site hit and make two meaningful contributions in the same round.',430,30],
['valBoss3','Final Boss','Get a 3K+ in a round your team was at risk of losing.',480,35]
]};
F.EVENTS=[
{id:'vrfsHeat',name:'VRFS HEAT',icon:'◈',desc:'Your next completed VRFS quest receives +20% XP.',game:'vrfs',bonus:1.2,label:'+20% VRFS XP'},
{id:'valHeat',name:'VALORANT OVERCLOCK',icon:'V',desc:'Your next completed VALORANT quest receives +20% XP.',game:'valorant',bonus:1.2,label:'+20% VAL XP'},
{id:'proofRush',name:'PROOF RUSH',icon:'▶',desc:'Any quest completed during this rotation receives +4 Sparks.',game:'all',sparks:4,label:'+4 SPARKS'},
{id:'bossSurge',name:'BOSS SURGE',icon:'♛',desc:'The daily Boss Quest receives +25% XP during this rotation.',game:'boss',bonus:1.25,label:'+25% BOSS XP'},
{id:'masteryFlux',name:'MASTERY FLUX',icon:'↗',desc:'Quest completions grant +25% game mastery during this rotation.',game:'all',mastery:1.25,label:'+25% MASTERY'},
{id:'coreLink',name:'CORE LINK',icon:'✦',desc:'Core Heat contributes twice its normal XP bonus to your next quest.',game:'all',heatMult:2,label:'2× HEAT BONUS'}
];
F.ACHIEVEMENTS=[
{id:'first',name:'First Spark',desc:'Complete your first quest.',icon:'✦',test:s=>s.stats.completed>=1},
{id:'board',name:'Full Board',desc:'Complete all 5 daily quests.',icon:'◆',test:s=>s.stats.fullBoards>=1},
{id:'boss',name:'Boss Down',desc:'Complete a Boss Quest.',icon:'♛',test:s=>s.stats.bosses>=1},
{id:'ten',name:'Forged',desc:'Complete 10 quests.',icon:'◈',test:s=>s.stats.completed>=10},
{id:'fifty',name:'Overdrive',desc:'Complete 50 quests.',icon:'⚡',test:s=>s.stats.completed>=50},
{id:'streak3',name:'Hot Streak',desc:'Reach a 3-day streak.',icon:'↗',test:s=>s.streak>=3},
{id:'streak7',name:'No Cooldown',desc:'Reach a 7-day streak.',icon:'∞',test:s=>s.streak>=7},
{id:'balanced',name:'Dual Main',desc:'Reach 1,000 mastery in both games.',icon:'◇',test:s=>s.mastery.vrfs>=1000&&s.mastery.valorant>=1000},
{id:'vrfsMaster',name:'Pitch Forged',desc:'Reach 5,000 VRFS mastery.',icon:'◈',test:s=>s.mastery.vrfs>=5000},
{id:'valMaster',name:'Radiant Steel',desc:'Reach 5,000 VALORANT mastery.',icon:'V',test:s=>s.mastery.valorant>=5000},
{id:'lvl10',name:'Tempered',desc:'Reach level 10.',icon:'⬢',test:s=>F.levelFromXp(s.xp).level>=10},
{id:'lvl25',name:'Ascendant Forge',desc:'Reach level 25.',icon:'✺',test:s=>F.levelFromXp(s.xp).level>=25}
];
F.TITLES=[
{id:'unforged',name:'UNFORGED',req:'Starter',test:()=>true},{id:'spark',name:'SPARK RUNNER',req:'Level 3',test:s=>F.levelFromXp(s.xp).level>=3},{id:'proof',name:'PROOFED',req:'10 quests',test:s=>s.stats.completed>=10},{id:'streak',name:'HEAT HOLDER',req:'3-day streak',test:s=>s.streak>=3},{id:'boss',name:'BOSS BREAKER',req:'3 Boss Quests',test:s=>s.stats.bosses>=3},{id:'dual',name:'DUAL MAIN',req:'1,000 mastery both',test:s=>s.mastery.vrfs>=1000&&s.mastery.valorant>=1000},{id:'overdrive',name:'OVERDRIVE',req:'Level 15',test:s=>F.levelFromXp(s.xp).level>=15},{id:'legend',name:'FORGE LEGEND',req:'Level 30',test:s=>F.levelFromXp(s.xp).level>=30}
];
F.THEMES=[
{id:'ember',name:'EMBER',req:'Starter',sw1:'#ff6a2b',sw2:'#ffb14d',accent:'#ff6a2b',accent2:'#ffb14d',test:()=>true},{id:'rift',name:'RIFT',req:'Level 5',sw1:'#8b68ff',sw2:'#55d8ff',accent:'#8b68ff',accent2:'#55d8ff',test:s=>F.levelFromXp(s.xp).level>=5},{id:'mint',name:'MINT CORE',req:'3-day streak',sw1:'#4be2a0',sw2:'#52d7ff',accent:'#4be2a0',accent2:'#52d7ff',test:s=>s.streak>=3},{id:'crimson',name:'CRIMSON',req:'2,500 VAL mastery',sw1:'#ff4e62',sw2:'#ff9a55',accent:'#ff4e62',accent2:'#ff9a55',test:s=>s.mastery.valorant>=2500},{id:'azure',name:'AZURE',req:'2,500 VRFS mastery',sw1:'#45c8ff',sw2:'#7487ff',accent:'#45c8ff',accent2:'#7487ff',test:s=>s.mastery.vrfs>=2500},{id:'crown',name:'CROWN',req:'Level 20',sw1:'#ffd36a',sw2:'#ff6a2b',accent:'#ffd36a',accent2:'#ff8f3f',test:s=>F.levelFromXp(s.xp).level>=20}
];
F.RANKS=['UNFORGED','SPARK','TEMPERED','HARDENED','OVERDRIVE','MASTERWORK','ASCENDANT'];
F.levelFromXp=xp=>{let level=1,need=500,total=Number(xp)||0,spent=0;while(total-spent>=need&&level<99){spent+=need;level++;need=Math.floor(500*Math.pow(1.09,level-1))}return{level,current:total-spent,need,progress:Math.min(1,(total-spent)/need),rank:F.RANKS[Math.min(F.RANKS.length-1,Math.floor((level-1)/5))]}};
F.masteryName=x=>x>=7500?'MYTHIC':x>=5000?'MASTER':x>=2500?'ELITE':x>=1000?'FORGED':x>=400?'RISING':'INITIATE';
})();
