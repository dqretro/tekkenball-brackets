function assignRounds(matches, playersCount) {
  if (!matches || matches.length === 0) return [];
  const totalRounds = Math.ceil(Math.log2(playersCount));
  return matches.map((m, idx) => ({ ...m, round: Math.floor(idx / (matches.length / totalRounds)) + 1 }));
}

function generateDummySets(players) {
  if (!players || players.length < 2) return [];
  const sets = [];
  for (let i=0;i<players.length;i+=2){
    if(players[i+1]) sets.push({ player1: players[i], player2: players[i+1], winner: players[i], score: "2-0" });
  }
  return sets;
}

// ---------------- Pools ----------------
async function renderPoolsBrackets(slug){
  const poolsContainer = document.getElementById("poolsContainer");
  if(!poolsContainer||!slug) return;

  const tournament = await fetchTournament(slug);
  const event = tournament.events.find(ev=>ev.slug===slug);
  if(!event) return;

  poolsContainer.innerHTML = "";
  let pools = event.pools || [];

  // Fallback: create dummy pools if none exist
  if(!pools.length){
    const entrants = event.entrants?.nodes||[];
    let poolIndex=1;
    if(entrants.length){
      for(let i=0;i<entrants.length;i+=4){
        pools.push({ name:`Pool ${poolIndex++}`, players: entrants.slice(i,i+4).map(e=>e.name||"Unknown"), sets:[] });
      }
    } else {
      // Create one placeholder pool
      pools.push({ name:"Pool 1", players:["TBD"], sets:[] });
    }
  }

  if(pools.length===1){
    const pool = pools[0];
    const poolDiv = document.createElement("div");
    poolDiv.className="bracket-container";
    poolDiv.innerHTML=`<h3>${pool.name}</h3>`;
    poolsContainer.appendChild(poolDiv);

    const players = pool.players||["TBD"];
    const matches = pool.sets?.length ? pool.sets.map(s=>({player1:s.winner,player2:s.loser,winner:s.winner,score:s.score})) : generateDummySets(players);
    const matchesWithRounds = assignRounds(matches,players.length);

    new BracketsViewer(poolDiv,{teams:players,matches:matchesWithRounds},{doubleElimination:false});
  } else {
    pools.forEach(pool=>{
      const poolLink = document.createElement("a");
      poolLink.href=`pool.html?slug=${encodeURIComponent(slug)}&pool=${encodeURIComponent(pool.name)}`;
      poolLink.className="pool-card";

      const title = document.createElement("h3");
      title.textContent = pool.name;
      poolLink.appendChild(title);

      const miniDiv = document.createElement("div");
      miniDiv.style.height="120px";
      miniDiv.style.width="100%";
      poolLink.appendChild(miniDiv);

      const players = pool.players?.length ? pool.players : ["TBD"];
      const matches = pool.sets?.length ? pool.sets.map(s=>({player1:s.winner,player2:s.loser,winner:s.winner,score:s.score})) : generateDummySets(players);
      const matchesWithRounds = assignRounds(matches,players.length);

      new BracketsViewer(miniDiv,{teams:players,matches:matchesWithRounds},{doubleElimination:false,compact:true});
      poolsContainer.appendChild(poolLink);
    });
  }
}

// ---------------- Top Cut ----------------
async function renderTopCutBracket(slug){
  const topcutContainer = document.getElementById("topcutContainer");
  if(!topcutContainer||!slug) return;

  const tournament = await fetchTournament(slug);
  const event = tournament.events.find(ev=>ev.slug===slug);

  topcutContainer.innerHTML = "";

  let players = event?.topcut?.players || [];
  let matches = event?.topcut?.sets?.length ? event.topcut.sets.map(s=>({player1:s.winner,player2:s.loser,winner:s.winner,score:s.score})) : generateDummySets(players.length?players:["TBD"]);
  let matchesWithRounds = assignRounds(matches,players.length?players.length:1);

  // Always show a clickable top cut card
  const topcutLink = document.createElement("a");
  topcutLink.href=`topcut.html?slug=${encodeURIComponent(slug)}`;
  topcutLink.className="pool-card";
  topcutLink.style.flexDirection="column";

  const title = document.createElement("h3");
  title.textContent = players.length ? `Top ${players.length}` : "Top Cut (TBD)";
  topcutLink.appendChild(title);

  const miniDiv = document.createElement("div");
  miniDiv.style.height="120px";
  miniDiv.style.width="100%";
  topcutLink.appendChild(miniDiv);

  if(players.length){
    new BracketsViewer(miniDiv,{teams:players,matches:matchesWithRounds},{doubleElimination:true,compact:true});
  } else {
    miniDiv.innerHTML="<p style='text-align:center;color:#999;'>No top cut yet</p>";
  }

  topcutContainer.appendChild(topcutLink);
}

document.addEventListener("DOMContentLoaded",()=>{
  const slug = new URLSearchParams(window.location.search).get("slug");
  if(!slug) return;

  if(document.getElementById("poolsContainer")) renderPoolsBrackets(slug);
  if(document.getElementById("topcutContainer")) renderTopCutBracket(slug);
});
