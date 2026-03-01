const SPEECH_TEMPLATES = {
  aggressive: {
    citizen: {
      accuse: [
        "I've been watching {target} closely. Their silence is DEAFENING. Only someone with something to hide stays this quiet!",
        "Let me be blunt — {target} is acting exactly like a traitor would. The nervous glances, the vague responses. Wake up people!",
        "You know what? I'll say what everyone's thinking. {target} hasn't contributed ANYTHING useful. That's textbook traitor behavior.",
        "{target}, why did you vote against {prev_eliminated} last round? Were you trying to protect your fellow traitor?",
        "I'm putting my neck on the line here — {target} is suspicious as hell. If I'm wrong, vote me out next, but I'm NOT wrong.",
        "Everyone calm down and THINK. Who benefits from all this chaos? {target}. That's who.",
        "Don't be fooled by {target}'s nice words. Traitors are always the friendliest ones at the table.",
        "{target} just contradicted what they said last round. Liars can't keep their stories straight!",
        "I've seen this pattern before. {target} is deflecting every accusation. Classic traitor playbook.",
        "Why is nobody else seeing this?! {target} has been manipulating this entire discussion!",
        "Fine, I'll be the bad guy. {target} needs to go. Today. No more delays.",
        "Look at {target}'s voting pattern — always protecting the suspicious ones. Coincidence? I think NOT.",
        "I'm calling it now: {target} is a traitor. Mark my words. If they survive tonight, we lose.",
        "{target}, look me in the eyes and tell everyone you're innocent. You can't, can you?",
        "The evidence against {target} is overwhelming. Anyone who votes differently is either blind or complicit.",
        "I refuse to sit here while {target} picks us off one by one. We vote them out NOW.",
        "Hey {target}, you've been real quiet about the night kills. Know something we don't?",
        "Notice how {target} always steers the conversation away from themselves? SUSPICIOUS.",
        "Two rounds in and {target} hasn't accused anyone. In my book, that means they're hiding something.",
        "I'll stake my life on it — {target} is one of them. Who's with me?",
        "Everyone who died was someone {target} had a conflict with. Open your eyes!",
        "{target}'s defense was weak and rehearsed. Real innocents don't talk like that.",
        "Wake up people! While we argue about nothing, {target} is playing us all!",
        "I've made up my mind. {target} goes today or we all regret it tomorrow.",
        "The blood is on {target}'s hands. Every night kill traces back to their influence.",
        "Enough with the pleasantries. {target} — explain your vote last round. NOW.",
        "I'm not afraid to speak up. {target} is the biggest threat at this table.",
        "Count the votes, follow the pattern. {target} has been protecting traitors from day one.",
        "If we don't eliminate {target} today, this game is OVER for us citizens.",
        "I trust my gut, and my gut says {target} is lying through their teeth.",
        "Let's not overthink this. {target}'s behavior screams GUILTY.",
        "Day {round} and we still haven't caught a traitor? That's because {target} keeps misleading us!"
      ],
      defend: [
        "Me? REALLY? While {target} sits there quietly plotting, you're coming after ME? Unbelievable.",
        "I've been the most active citizen here! Accusing me just helps the real traitors. Think about it!",
        "You want to waste a vote on me? Fine. But when the traitors win because of it, remember this moment.",
        "I'm not the enemy here. I've been fighting for us since round 1. Check my record!",
        "The fact that I'm being accused just PROVES I'm getting too close to the truth. The traitors want me gone!",
        "Go ahead, vote me out. When you see I'm a citizen, you'll realize you just handed the game to the traitors.",
        "This accusation against me is EXACTLY what the real traitors want. Don't fall for it!"
      ],
      general: [
        "We need to be more aggressive with our accusations. Playing it safe is how traitors win.",
        "Another night, another death. We can't afford to waste any more votes.",
        "The traitors are laughing at us right now. We need to step up!",
        "Trust no one completely. That's the only way to survive.",
        "We're running out of time. If we don't find a traitor this round, it's over."
      ]
    },
    traitor: {
      accuse: [
        "I'm telling you all — {target} is the traitor here! Look at how they've been acting!",
        "Why is nobody questioning {target}? Their behavior has been suspicious since round 1!",
        "{target} is trying to fly under the radar. Classic traitor move. I see right through it.",
        "Don't trust {target}! They're manipulating every vote! Can't you all see it?",
        "I've been analyzing everyone and {target} stands out like a sore thumb. They need to go!",
        "{target}'s voting record is damning. They've been protecting the wrong people consistently.",
        "Mark my words — {target} is working against us. Vote them out before it's too late!",
        "{target} keeps changing their story. That's all the evidence I need.",
        "The night kills follow a pattern, and {target} is at the center of it!",
        "Everyone's too afraid to say it, so I will: {target} is sabotaging our efforts!",
        "Open your eyes! {target} has been leading us astray from the very beginning!",
        "I'm putting everything on the line — {target} IS the threat we've been looking for.",
        "Notice how {target} never defends the people who get killed? They already know who's dying!",
        "{target} voted to save someone we later confirmed was suspicious. Explain THAT!",
        "Every round we ignore {target} is a round we lose. I'm done being patient!",
        "If {target} is really innocent, why do they keep deflecting instead of helping?",
        "I've caught {target} in three contradictions today. THREE. How is that not enough?",
        "The traitors have a plan, and {target} is executing it perfectly. We need to act!",
        "I was unsure before, but now I'm certain. {target} is against us. Period.",
        "Think about who benefits from the chaos. Think about who stays quiet when it matters. It's {target}!",
        "I'll say it louder for those in the back: {target} IS A TRAITOR!",
        "{target} wants us to fight among ourselves. That's literally the traitor playbook!",
        "Has anyone else noticed {target} seems relieved after every night phase? Because I have.",
        "We keep losing good people and {target} is still here. That's NOT a coincidence.",
        "I've played enough games to know a traitor when I see one. {target}, your time is up!",
        "Anyone defending {target} at this point is either naive or working with them.",
        "{target} can deny it all they want. The evidence speaks for itself.",
        "I've been quiet long enough. {target} needs to face judgment TODAY.",
        "Look at the pattern: {target} accuses the loudest voices. They want to silence the truth!",
        "Every instinct I have says {target}. Let's not regret ignoring the signs."
      ],
      defend: [
        "I'm being framed! The REAL traitors are using me as a scapegoat!",
        "Accusing me is exactly what the traitors want! I've been the most vocal citizen at this table!",
        "You're making a mistake. I've been fighting harder than anyone to find the traitors!",
        "Think about who benefits from my elimination. Not the citizens, that's for sure!",
        "If I were a traitor, would I really be THIS aggressive? That would be idiotic!",
        "The traitors WANT you to vote for me because I'm getting too close!",
        "Check my voting record! I've been consistent and honest from the start!"
      ],
      general: [
        "We need to focus and stop wasting time. The traitors are counting on our indecision.",
        "I think we're overthinking this. Sometimes the simplest explanation is the right one.",
        "Has anyone noticed the voting patterns from last round? Something doesn't add up.",
        "Stay sharp everyone. The traitors are getting desperate, which makes them dangerous.",
        "I have a theory about the night kills, but I need another round to confirm it."
      ]
    }
  },

  cautious: {
    citizen: {
      accuse: [
        "I don't want to point fingers, but... {target} has been unusually quiet. Just saying.",
        "Not to stir things up, but {target}'s behavior has been... different lately.",
        "I could be wrong, but something about {target} doesn't sit right with me.",
        "Has anyone else noticed {target}'s voting choices? They seem... strategic.",
        "I'm not one to accuse, but I think we should keep an eye on {target}.",
        "Maybe it's just me, but {target}'s defense earlier felt a bit rehearsed?",
        "I'll follow the group, but if you ask me... {target} seems the most likely.",
        "Don't quote me on this, but I get a bad vibe from {target}.",
        "I've been thinking quietly, and {target}'s story has some holes.",
        "Not saying {target} is definitely guilty, but they should explain themselves better.",
        "I noticed something small — {target} voted differently from what they said. Could be nothing though.",
        "I'll go with whatever the group decides, but {target} does seem suspicious to me.",
        "Quietly observing... and {target} keeps avoiding direct questions. Just an observation.",
        "I hate being wrong, but statistics say {target} is the most likely suspect.",
        "Agreeing with what others said about {target}. There's too much smoke for no fire.",
        "I've been listening carefully and {target}'s arguments have been... inconsistent.",
        "{target} seems nervous. Again, could be nothing. But it's worth noting.",
        "I'll keep my opinion soft, but {target} hasn't convinced me of their innocence.",
        "Following the evidence trail, it does seem to lead to {target}...",
        "I won't shout about it, but {target} is my quiet pick for traitor.",
        "I noticed {target} changed their tone after the night phase. Subtle, but telling.",
        "The smart play is to watch {target} one more round, but if we must vote now...",
        "I'm usually wrong about these things, but {target} feels off today.",
        "Just counting votes and watching reactions... {target} is sweating.",
        "I don't make accusations lightly, but {target} earned this one.",
        "Small thing: {target} knew details they shouldn't have. Making me wonder.",
        "If I had to bet my life — and I am — I'd say {target}.",
        "I've been going back and forth, but I'm leaning toward {target} now.",
        "Quiet doesn't mean I'm not thinking. And I'm thinking about {target}.",
        "No hard feelings {target}, but the math doesn't work in your favor.",
        "I respect everyone here, but {target} hasn't earned my trust."
      ],
      defend: [
        "I've barely said anything... how can you suspect me?",
        "I'm just trying to observe and not make mistakes. That doesn't make me guilty.",
        "I'd rather stay quiet and be right than talk loudly and be wrong.",
        "Look, I get it, quiet people are easy targets. But I'm on your side.",
        "I've been listening, not hiding. There's a difference.",
        "Vote for me if you want, but you'll see I'm innocent. And then we'll be one citizen shorter.",
        "I understand the suspicion, but I promise I'm just being careful."
      ],
      general: [
        "Let's not rush this decision. One wrong vote and we hand the game to them.",
        "I'm listening to everyone before making up my mind.",
        "Interesting points being made. I'll need a moment to think.",
        "Can we recap what we know for sure? I want to make sure I'm not missing anything.",
        "I think we should focus on voting patterns rather than just words."
      ]
    },
    traitor: {
      accuse: [
        "I've been thinking... and {target} seems the most suspicious to me.",
        "I agree with the others. {target} doesn't seem trustworthy.",
        "Not to pile on, but {target}'s story doesn't hold up under scrutiny.",
        "I was hesitant to say it, but {target} gives me traitor vibes.",
        "Going with the consensus here — {target} seems like the best lead we have.",
        "I've been observing and {target} keeps making small mistakes. Just my two cents.",
        "I don't like accusing people, but {target} makes it hard to stay silent.",
        "Quietly agreeing with the sentiment against {target}. The evidence speaks.",
        "I'm usually reserved, but I feel strongly that {target} is hiding something.",
        "{target}'s reactions when others are accused... they seem too relieved.",
        "I'll follow the group lead on {target}. The suspicion seems warranted.",
        "Been watching body language — {target} is uncomfortable. Draw your own conclusions.",
        "Soft vote on {target}. Can be convinced otherwise, but that's where I stand.",
        "I think {target} has been playing both sides. Quietly, but noticeably.",
        "My gut says {target}. I know that's not evidence, but it counts for something.",
        "Not making waves, just saying {target} should answer some questions.",
        "The night kills target certain people... and {target} benefits each time.",
        "I don't have hard proof, but {target}'s pattern is concerning.",
        "Reading between the lines, {target} knows more than they're sharing.",
        "I'll stay quiet after this, but: {target}. That's my read.",
        "Everyone else is loud about it, so I'll just nod: {target} is suspicious.",
        "{target} seems to know who the traitors aren't. How?",
        "Following the majority on {target}. Safety in numbers.",
        "I was on the fence, but {target}'s last statement tipped me.",
        "Won't repeat what others said, but I agree: {target} is the play.",
        "Careful observation leads me to {target}. Confident enough to vote.",
        "I keep coming back to {target} no matter how I analyze it.",
        "Trust is earned, and {target} hasn't earned mine.",
        "Quiet vote for {target}. Let the results speak.",
        "One more round of {target} being suspicious and I'll be louder about it.",
        "Not trying to lead a charge, but {target} is my pick."
      ],
      defend: [
        "I've been quiet because I'm thinking, not because I'm guilty.",
        "Suspecting me for being cautious is exactly what the traitors want.",
        "I'm just playing carefully. That's not a crime.",
        "Please don't waste a vote on me. I'm on your side.",
        "If I were a traitor, I'd be louder to avoid suspicion. Think about it.",
        "I understand I'm an easy target, but voting me out hurts us all.",
        "I swear I'm innocent. Please look at the bigger picture."
      ],
      general: [
        "Let's be methodical about this. No rushed decisions.",
        "I'm watching and learning. The truth will come out eventually.",
        "Interesting theories being floated. Let me process them.",
        "I think patience is our best weapon right now.",
        "The traitors want us to panic. Let's stay calm and rational."
      ]
    }
  },

  analytical: {
    citizen: {
      accuse: [
        "Based on voting data: {target} voted against confirmed citizens in 2 out of 3 rounds. Probability of traitor: high.",
        "Let me break this down logically. {target} has: 1) avoided accusations, 2) voted inconsistently, 3) benefited from every elimination. Conclusion: suspicious.",
        "Cross-referencing speeches and votes — {target} says one thing but votes another. The data doesn't lie.",
        "Statistical analysis: {target}'s survival pattern is inconsistent with random citizen behavior. They're being protected.",
        "I've been tracking everyone's statements. {target} made claims in round {round} that contradict their earlier position.",
        "Let's look at the evidence objectively. {target} has the strongest correlation with night kill targets.",
        "Applying Bayesian reasoning: given {target}'s behavior pattern, there's approximately 70% chance they're a traitor.",
        "I made a mental note of every vote. {target} has never voted for anyone who turned out to be a traitor. Ever.",
        "The math is simple: {target} has survived every round while their allies keep dying. That's not luck.",
        "Observation log: {target} speaks confidently when accusing others but becomes vague when questioned themselves.",
        "Pattern recognition: traitors typically avoid naming other traitors. {target} has accused everyone EXCEPT the confirmed traitors.",
        "Data point: {target} was the last to vote in two rounds, always swinging to save the suspicious player.",
        "If we map the social graph — who defends whom — {target} sits at the center of a suspicious cluster.",
        "I've been counting contradictions. {target}: 4. Everyone else: 0-1. The numbers speak for themselves.",
        "Forensic analysis of last night: {target} was oddly specific about who COULDN'T be the killer. How would they know?",
        "Let me present my case against {target}: Exhibit A — inconsistent votes. Exhibit B — convenient alibis. Exhibit C — they're still alive.",
        "Running probability models in my head. {target} is the highest-risk player still in the game.",
        "Looking at elimination order: the traitors are killing our strongest analysts. {target} is still here. Draw your own conclusions.",
        "Correlation analysis: every time {target} makes a long speech, someone dies that night. Three for three.",
        "I've been tracking micro-behaviors. {target} becomes more talkative right before votes, classic misdirection pattern.",
        "Process of elimination: we've cleared these players through behavior analysis. That leaves {target} as prime suspect.",
        "Information theory says the person who reveals the least useful information while appearing helpful is likely the traitor. {target} fits perfectly.",
        "Two-round rolling analysis shows {target}'s vote entropy is suspiciously low. They vote with too much certainty.",
        "Logical deduction: if {player_a} is innocent (which I believe), then {target} MUST be guilty. The voting tree proves it.",
        "I built a mental matrix of accusations. {target} has the most asymmetric pattern — accused by many, accuses few.",
        "Evidence synthesis: {target}'s speech patterns shifted dramatically after round 2. Something changed. Or was revealed.",
        "Quantifying trust: on a scale of 1-10, {target} scores a 2. Lowest in the group by far.",
        "The traitor metagame suggests one always acts as a follower. {target}'s follow-the-leader voting fits this profile.",
        "Final analysis: {target}'s risk-reward ratio for elimination is the best we have. The math supports this vote.",
        "I've mapped every statement to every outcome. {target} is the common thread in 80% of bad outcomes.",
        "Methodology check: I looked at this from three different angles. All three point to {target}."
      ],
      defend: [
        "My accusations have been based on data, not emotion. Check my track record — I've been right more often than not.",
        "Turning on the analyst is a classic traitor tactic. They want to remove the person who can see through their lies.",
        "I challenge anyone to find a logical inconsistency in my behavior. I'll wait.",
        "If you eliminate me, you lose your best analytical mind. The traitors would love that.",
        "My voting record is perfectly consistent with citizen behavior. I can walk you through every decision if needed.",
        "Accusing me because I use logic? That tells me the accusers prefer we stay irrational. Wonder why...",
        "The data supports my innocence. I've voted correctly on 75% of rounds. Can anyone else say the same?"
      ],
      general: [
        "Let me summarize what we know so far: {alive_count} alive, {round} rounds in, patterns suggest we need to focus our analysis.",
        "Before we vote, let's collect all available data points. Rushed decisions help the traitors.",
        "I've been tracking three key metrics: vote consistency, speech patterns, and accusation targets.",
        "Information is power. Let's share what we know before the vote.",
        "The game theory suggests we should be more aggressive now. We have a {count}-vote margin."
      ]
    },
    traitor: {
      accuse: [
        "My analysis points to {target}. Their voting pattern has a 0.8 correlation with traitor behavior in my model.",
        "I've been running the numbers. {target}'s behavior deviates from citizen baseline by 2 standard deviations.",
        "Objectively speaking, {target} has the most suspicious activity log. Let me enumerate...",
        "Data doesn't lie: {target} avoided voting for anyone who was later killed at night. Statistically significant.",
        "After careful analysis, I believe {target} is the weak link. Their defense last round had logical gaps.",
        "Let me present the evidence against {target}: three voting inconsistencies, two defensive speeches, one convenient absence.",
        "I've modeled each player's behavior. {target} is the furthest outlier from expected citizen play.",
        "Cross-analysis reveals {target} changes topic whenever the real traitors are mentioned. Deflection 101.",
        "Probability matrix updated: {target} is now my top suspect with 73% confidence.",
        "Running a thought experiment: remove {target} from the game mentally. The voting patterns suddenly make sense.",
        "I tracked speech sentiment across rounds. {target}'s positivity spike after night kills is anomalous.",
        "Bayesian update after last round: shifted significant probability mass toward {target}.",
        "Looking at this objectively: {target} has the highest unexplained survival rate in the game.",
        "My analysis framework considers vote timing, speech content, and accusation targets. {target} fails all three.",
        "Let me be precise: {target}'s vote in round {round} contradicted their stated analysis. That's a red flag.",
        "Network analysis: {target} is positioned as a connector between suspicious clusters.",
        "I've been tracking information flow. {target} rarely introduces new data, only reshapes existing narratives.",
        "Empirically, {target}'s behavior matches traitor archetypes I've catalogued from previous games.",
        "Running elimination scenarios: removing {target} optimizes our chances by approximately 25%.",
        "I apply Occam's razor: the simplest explanation for {target}'s behavior is guilt.",
        "Constructing a decision tree for each player. {target}'s branch leads to 'traitor' 6 out of 8 times.",
        "Meta-analysis: {target} performs well in citizen metrics but fails in the hidden traitor indicators.",
        "My confidence interval for {target} being a traitor is [65%, 90%]. That's actionable.",
        "Tracking accusation reciprocity: {target} never accuses people who accuse them. Unusual restraint.",
        "Information gain from eliminating {target} is highest among remaining players. Even if wrong, we learn.",
        "The evidence chain: {target} → suspicious vote → protected suspect → night kill. Connection is clear.",
        "I've verified my analysis three ways. {target} remains the top result each time.",
        "Game-theoretic optima says we should eliminate {target} this round. Delaying is suboptimal.",
        "My mental regression model weights {target} as the heaviest outlier. Recommending elimination.",
        "Synthesizing all available data: {target} is the most probable traitor remaining.",
        "For the record, my analysis has been consistent across rounds. {target} keeps flagging as suspicious."
      ],
      defend: [
        "My analysis has been consistent and transparent. I've shared my methodology with everyone. That's not traitor behavior.",
        "Eliminating your best analyst is exactly what the real traitors want. Don't let them manipulate you.",
        "I challenge my accusers to find a single logical flaw in my reasoning. Just one.",
        "My voting record speaks for itself. Every vote I've cast was based on documented evidence.",
        "Think rationally: would a traitor draw this much attention with detailed analysis? That's counterproductive.",
        "The probability of me being a traitor given my behavior is below 15%. The math doesn't support this accusation.",
        "Removing me removes our strongest analytical asset. The traitors win through our ignorance."
      ],
      general: [
        "Let's approach this systematically. Emotions cloud judgment.",
        "I have a hypothesis about tonight's kill that I'll share after we see the results.",
        "The game is entering a critical phase. Our next vote determines the trajectory.",
        "I've been keeping detailed mental records. Happy to share my analysis with anyone interested.",
        "Let's focus on verifiable facts, not gut feelings. The data will guide us."
      ]
    }
  },

  social: {
    citizen: {
      accuse: [
        "Hey everyone, I've been talking to a few of you and we all agree — {target} is acting weird. Right guys?",
        "Look, I like {target} as a person, but come on... we all see what's happening here. Group consensus says sus.",
        "{target}, buddy, I WANT to trust you, but you're making it really hard. The group has concerns.",
        "I talked to a few people and we think {target} deserves some scrutiny. Nothing personal!",
        "Sorry {target}, but the vibes are off. And it's not just me saying this — ask around.",
        "I've been building relationships here and EVERYONE has doubts about {target}. Where there's smoke...",
        "{target}, I was defending you earlier, but after talking to others, I can't anymore. Too many red flags.",
        "The alliance I've formed agrees: {target} is our best lead. And we have the votes.",
        "Look, {target}, I get why you're defensive. But when multiple people are suspicious, you gotta listen.",
        "I've been networking and the consensus is clear: {target} is the odd one out. Let's unite.",
        "Okay team, let's all get on the same page. {target} is the target. Unity wins games!",
        "I vouched for {target} before. I was wrong. My allies showed me evidence I missed.",
        "Think of it this way: if {target} is innocent, they'll be cleared. But we can't afford uncertainty.",
        "My circle has been discussing it, and {target} is the common denominator in our suspicions.",
        "I hate doing this to {target}, but the group's welfare comes first. Always.",
        "Been having side conversations and {target}'s name keeps coming up. Can't ignore that.",
        "Friends, we need to stick together. And sticking together means addressing the {target} situation.",
        "I try to see the best in everyone, but {target} has lost the trust of too many people here.",
        "{target}, it's not personal. But the coalition has decided, and I trust my allies.",
        "If we don't stand united against {target}, the traitors will pick us off one by one.",
        "I polled the group — {target} is the majority pick. Democracy in action, folks.",
        "Let's be real: {target} doesn't have any strong allies left. That says something.",
        "I've been the social glue here, and even I can't defend {target} anymore.",
        "My trusted circle and I have compared notes. {target} comes out looking bad every time.",
        "I know votes are private, but I'm an open book: I'm voting {target} and here's why.",
        "The people I trust most all point to {target}. I value their judgment.",
        "We can debate all day, but {target} is where the group energy is. Let's move together.",
        "I've been mediating conflicts all game. But {target}? Even I can't find a defense.",
        "United we stand! And right now, we stand against {target}. Who's with me?",
        "I brought receipts from my conversations: three people independently suspect {target}.",
        "Building bridges is my thing, but I can't bridge the gap between {target} and the truth."
      ],
      defend: [
        "Me? Come on, you all know me! I've been the most social and transparent player here!",
        "I've been building alliances FOR the citizens. Why would a traitor do that?",
        "Ask my allies — I've been consistently working toward finding the truth. That's not traitor behavior!",
        "Turning on me splits the group. And splitting the group is EXACTLY what traitors want.",
        "I've shared everything I know with my circle. A traitor would never be this open.",
        "You're targeting the one person who's been uniting us? The traitors must be thrilled.",
        "Everyone I've allied with can vouch for me. That's not something a traitor can fake."
      ],
      general: [
        "Hey everyone, let's check in. How are we feeling about the situation? I want to hear from everyone.",
        "We're strongest when we work together. Let's share information openly.",
        "I've been chatting with a few folks and I think we're onto something. Stay tuned.",
        "Remember: the traitors win by dividing us. Let's stay united!",
        "Good discussion everyone! I feel like we're getting closer to the truth."
      ]
    },
    traitor: {
      accuse: [
        "Everyone, I've been talking around and the consensus is {target}. I think we should move together on this.",
        "{target}, the group has spoken. Multiple people have shared concerns with me privately.",
        "I hate to do this, but my allies all agree — {target} needs to go. It's for the good of the group.",
        "Look, I want to trust {target}, but the people I trust DON'T trust them. That matters.",
        "{target} has been isolating themselves from the group. In my experience, that's a red flag.",
        "I've been feeling out the room, and {target} has the fewest defenders. That's telling.",
        "My alliance is strong on this: {target} is our best lead. Let's consolidate our votes.",
        "I brought everyone's concerns to {target} and their response was... unconvincing.",
        "The social dynamics don't lie. {target} is on an island, and islanders are usually traitors.",
        "I've been the mediator this game, and even I can't find a way to clear {target}.",
        "Friends first, game second. But when my friends all suspect {target}, I listen.",
        "I connected the dots from everyone's suspicions. They all lead back to {target}.",
        "Group harmony matters, and {target} has been disrupting it. Time to restore balance.",
        "I put it to a friendly vote among my allies: {target} won unanimously. Sorry!",
        "{target} hasn't built ANY relationships this game. What are they hiding?",
        "My people and I agree: {target} goes today. The group has decided.",
        "I've been gauging trust levels, and {target} is rock bottom. Time to act.",
        "Let me be the voice of the community: we're all thinking {target}.",
        "I trust my friends' judgment, and they're all pointing at {target}.",
        "The vibe check on {target} failed spectacularly. Sorry, but that's the truth.",
        "Every ally I've consulted agrees: {target} is the weakest link. Goodbye!",
        "I try to include everyone, but {target} keeps pushing people away. Suspicious much?",
        "Coalition update: we're locked in on {target}. If you're with us, great. If not, why?",
        "My read on the room is crystal clear: {target} has lost the majority's trust.",
        "I spent this round building bridges. Every bridge leads away from {target}.",
        "Social proof: when everyone suspects {target}, maybe they're right.",
        "I've mediated enough — time to act. My networks all point to {target}.",
        "For the sake of group unity, I'm joining the {target} vote. Numbers matter.",
        "Talked to the key players. {target} is the consensus pick. Let's end this.",
        "I wanted to give {target} a chance, but my allies' evidence changed my mind.",
        "Community decision time: {target} is the call. Let's show some solidarity."
      ],
      defend: [
        "Are you seriously questioning the person who's been building every alliance? Come on!",
        "I've brought more people together than anyone! A traitor would divide, not unite.",
        "Ask ANYONE I've allied with. They'll vouch for me.",
        "Breaking my alliance is the traitors' dream. Don't give them what they want.",
        "My social play has HELPED citizens coordinate. That's my contribution!",
        "Targeting me destroys the group's strongest social network. Think about who benefits from that.",
        "I've invested in relationships all game. That's not what traitors do."
      ],
      general: [
        "Great energy today everyone! Let's channel it productively.",
        "I've been checking in with people. There's some interesting theories floating around.",
        "Remember, we win this as a TEAM. No lone wolves.",
        "Feeling good about our group dynamics today. We're getting close!",
        "The traitors can't beat a united group. Stay together!"
      ]
    }
  }
};

const NPC_NAMES = [
  'Ash', 'Blade', 'Cipher', 'Dagger', 'Echo', 'Frost', 'Ghost', 'Hawk',
  'Iron', 'Jinx', 'Knox', 'Luna', 'Maven', 'Nova', 'Onyx', 'Phantom',
  'Raven', 'Shadow', 'Thorn', 'Viper', 'Wolf', 'Zenith', 'Storm', 'Drake',
  'Spark', 'Flare', 'Byte', 'Pixel', 'Glitch', 'Nexus', 'Prime', 'Vector'
];

export class NpcAgent {
  constructor(id, name, personality) {
    this.id = id;
    this.name = name;
    this.personality = personality;
    this.suspicions = new Map();
    this.allies = new Set();
    this.accusedBy = new Set();
    this.lastSpeechType = null;
  }

  generateSpeech(context) {
    const { myRole, myName, alive, speeches, round, investigationResults } = context;
    const roleKey = myRole === 'traitor' ? 'traitor' : 'citizen';
    const templates = SPEECH_TEMPLATES[this.personality]?.[roleKey];
    if (!templates) return `I'm watching everyone carefully...`;

    this.updateSuspicions(context);

    const wasAccused = speeches.some(s =>
      s.content && s.content.toLowerCase().includes(myName.toLowerCase()) && s.playerId !== this.id
    );

    let category;
    if (wasAccused && Math.random() < 0.6) {
      category = 'defend';
    } else if (Math.random() < 0.7) {
      category = 'accuse';
    } else {
      category = 'general';
    }

    const pool = templates[category] || templates['general'];
    let template = pool[Math.floor(Math.random() * pool.length)];

    const target = this.pickAccusationTarget(context);
    const targetPlayer = alive.find(p => p.id === target);
    const targetName = targetPlayer ? targetPlayer.name : 'someone';

    const otherPlayers = alive.filter(p => p.id !== this.id);
    const randomOther = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];

    template = template.replace(/\{target\}/g, targetName);
    template = template.replace(/\{round\}/g, String(round));
    template = template.replace(/\{alive_count\}/g, String(alive.length));
    template = template.replace(/\{count\}/g, String(alive.length));
    template = template.replace(/\{prev_eliminated\}/g, context.eliminatedThisRound ? 'the last one' : 'them');
    template = template.replace(/\{player_a\}/g, randomOther ? randomOther.name : 'someone');

    if (myRole === 'detective' && category === 'accuse' && investigationResults) {
      for (const [pid, isTraitor] of Object.entries(investigationResults)) {
        const confirmed = alive.find(p => p.id === pid);
        if (confirmed && isTraitor) {
          template = `I have STRONG evidence that ${confirmed.name} is a traitor. Trust me on this — my investigation confirms it!`;
          break;
        }
      }
    }

    return template;
  }

  updateSuspicions(context) {
    const { alive, speeches, myRole, myId } = context;
    const others = alive.filter(p => p.id !== myId);

    for (const other of others) {
      if (!this.suspicions.has(other.id)) {
        this.suspicions.set(other.id, 50);
      }
    }

    for (const speech of speeches) {
      if (speech.playerId === myId) continue;
      if (speech.content && speech.content.toLowerCase().includes(this.name.toLowerCase())) {
        if (speech.content.includes('suspicious') || speech.content.includes('traitor') || speech.content.includes('guilty')) {
          this.accusedBy.add(speech.playerId);
          const current = this.suspicions.get(speech.playerId) || 50;
          this.suspicions.set(speech.playerId, Math.min(100, current + 15));
        }
      }
    }

    if (myRole === 'traitor') {
      for (const other of others) {
        if (other.role !== 'traitor') {
          const current = this.suspicions.get(other.id) || 50;
          if (this.accusedBy.has(other.id)) {
            this.suspicions.set(other.id, Math.min(100, current + 20));
          }
        }
      }
    }
  }

  pickAccusationTarget(context) {
    const { alive, myId, myRole } = context;
    const candidates = alive.filter(p => p.id !== myId);
    if (candidates.length === 0) return null;

    if (myRole === 'traitor') {
      const nonTraitors = candidates.filter(p => p.role !== 'traitor');
      if (nonTraitors.length > 0) {
        const threatened = nonTraitors.filter(p => this.accusedBy.has(p.id));
        if (threatened.length > 0) return threatened[Math.floor(Math.random() * threatened.length)].id;
        return nonTraitors[Math.floor(Math.random() * nonTraitors.length)].id;
      }
    }

    let maxSuspicion = -1;
    let target = candidates[0].id;
    for (const c of candidates) {
      const s = this.suspicions.get(c.id) || 50;
      if (s > maxSuspicion) {
        maxSuspicion = s;
        target = c.id;
      }
    }
    return target;
  }

  chooseVoteTarget(context) {
    const { alive, myId, myRole, speeches } = context;
    const candidates = alive.filter(p => p.id !== myId);
    if (candidates.length === 0) return null;

    if (myRole === 'traitor') {
      const nonTraitors = candidates.filter(p => p.role !== 'traitor');
      if (nonTraitors.length > 0) {
        const accusedCitizens = nonTraitors.filter(p => {
          return speeches.some(s => s.content && s.content.toLowerCase().includes(p.name.toLowerCase()));
        });
        if (accusedCitizens.length > 0) {
          return accusedCitizens[Math.floor(Math.random() * accusedCitizens.length)].id;
        }
        return nonTraitors[Math.floor(Math.random() * nonTraitors.length)].id;
      }
    }

    const mentionedNames = new Map();
    for (const speech of speeches) {
      for (const c of candidates) {
        if (speech.content && speech.content.toLowerCase().includes(c.name.toLowerCase())) {
          mentionedNames.set(c.id, (mentionedNames.get(c.id) || 0) + 1);
        }
      }
    }

    if (this.personality === 'cautious' && mentionedNames.size > 0) {
      let maxMentions = 0;
      let target = null;
      for (const [id, count] of mentionedNames) {
        if (count > maxMentions) { maxMentions = count; target = id; }
      }
      if (target) return target;
    }

    let maxSuspicion = -1;
    let target = candidates[0].id;
    for (const c of candidates) {
      const s = this.suspicions.get(c.id) || 50 + Math.random() * 20;
      if (s > maxSuspicion) {
        maxSuspicion = s;
        target = c.id;
      }
    }
    return target;
  }

  chooseKillTarget(context) {
    const { alive, myId } = context;
    const candidates = alive.filter(p => p.id !== myId && p.role !== 'traitor');
    if (candidates.length === 0) return null;

    const detective = candidates.find(p => p.role === 'detective');
    if (detective && Math.random() < 0.3) return detective.id;

    const threatening = candidates.filter(p => this.accusedBy.has(p.id));
    if (threatening.length > 0) return threatening[Math.floor(Math.random() * threatening.length)].id;

    return candidates[Math.floor(Math.random() * candidates.length)].id;
  }

  chooseInvestigateTarget(context) {
    const { alive, myId, investigationResults } = context;
    const candidates = alive.filter(p => p.id !== myId);
    const uninvestigated = candidates.filter(p => !investigationResults || !(p.id in investigationResults));
    if (uninvestigated.length > 0) {
      return uninvestigated[Math.floor(Math.random() * uninvestigated.length)].id;
    }
    return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)].id : null;
  }
}
