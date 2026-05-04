export type Translations = {
  common: {
    cancel: string;
    back: string;
    confirm: string;
    errorImport: string;
    newMatchQuestion: string;
    resetMessage: string;
    yes: string;
    no: string;
    set: string;
  };
  updates: {
    button: string;
    title: string;
    items: string[];
  };
  setup: {
    title: string;
    subtitle: string;
    teamNames: string;
    yourTeam: string;
    opponent: string;
    newMatch: string;
    startServing3: string;
    opponentServes3: string;
    startServing5: string;
    opponentServes5: string;
    importData: string;
    importJson: string;
    ourTeamDefault: string;
    opponentTeamDefault: string;
    moreTools: string;
  };
  live: {
    resetMatch: string;
    finishMatch: string;
    serving: string;
    point: string;
    undoLast: string;
    swapSides: string;
    timeout: string;
    timeoutTitle: string;
    timeoutPrompt: string;
  };
  recording: {
    ourPoint: string;
    opponentPoint: string;
    howItHappened: string;
    receiveQuality: string;
    receiveQualityDetail: string;
    sideoutDetail: string;
    additionalDetails: string;
    wasItSideout: string;
    scoredFirstAttempt: string;
    wasThereCover: string;
    whyDidTheyScore: string;
    goodSpike: string;
    failedReceive: string;
    error: string;
    errorDetail: string;
    fault: string;
    faultDetail: string;
    passA: string;
    passB: string;
    passC: string;
  };
  analysis: {
    title: string;
    backToMatch: string;
    allMatch: string;
    exportJson: string;
    newMatch: string;
    summary: string;
    totalPoints: string;
    scoringDist: string;
    errorDist: string;
    receiveQualityDist: string;
    pointsPerSet: string;
    ourScore: string;
    opponentScore: string;
    setScoreFlow: string;
    fullView: string;
    precisionView: string;
    visiblePoints: string;
    clickPointHint: string;
    noPointsInSet: string;
    pointDetails: string;
    pointLabel: string;
    scoredBy: string;
    servingTeam: string;
    reasonLabel: string;
    scoreAfterPoint: string;
    setFlowXAxis: string;
    setFlowYAxis: string;
    timeoutLabel: string;
    timeoutCalledBy: string;
    detailedStats: string;
    blocks: string;
    blockOuts: string;
    spikeKills: string;
    spikeTips: string;
    aces: string;
    setDumps: string;
    opponentErrors: string;
    sideouts: string;
    receiveQuality: string;
    blockOutAgainst: string;
    coverExisted: string;
    opponentSpikeKills: string;
    opponentSpikeTips: string;
    faults: string;
    pointsGiven: string;
    resumeMatch: string;
  };
  reasons: {
    block: string;
    block_out: string;
    spike_kill: string;
    spike_tip: string;
    ace: string;
    set_dump: string;
    opponent_error: string;
    block_against: string;
    block_out_against: string;
    spike_kill_against: string;
    spike_tip_against: string;
    missed_free_ball: string;
    ball_into_net: string;
    ball_out_of_bounds: string;
    bad_set: string;
    serve_miss: string;
    net_touch: string;
    backline_fault: string;
    center_line_violation: string;
    over_the_net_fault: string;
    four_touches: string;
    double_touch: string;
  };
};

export const en: Translations = {
  common: {
    cancel: "Cancel",
    back: "Back",
    confirm: "Yes, Start New Match",
    errorImport: "Error importing match data. Invalid JSON.",
    newMatchQuestion: "New Match?",
    resetMessage: "Are you sure you want to start a new match? Current data will be lost if not exported.",
    yes: "Yes",
    no: "No",
    set: "SET",
  },
  updates: {
    button: "Last updates",
    title: "Recent updates",
    items: [
      "Timeouts",
      "Faults",
      "Spike tip point option",
      "New per set point graph",
      "Portuguese language support",
      "Sideout statistics",
      "App now has icons",
      "App works as a web app and can be installed",
      "Added block out option for both teams and detailed block out stats",
      "New colors on the graphs",
      "Small user interface improvements",
    ],
  },
  setup: {
    title: "Volleyball Match Analysis",
    subtitle: "Start a new match or import existing data",
    teamNames: "Team Names",
    yourTeam: "Your Team",
    opponent: "Opponent",
    newMatch: "New Match",
    startServing3: "3 Set Match (Start Serving)",
    opponentServes3: "3 Set Match (Opponent Serves)",
    startServing5: "5 Set Match (Start Serving)",
    opponentServes5: "5 Set Match (Opponent Serves)",
    importData: "Import Data",
    importJson: "Import JSON",
    ourTeamDefault: "Our Team",
    opponentTeamDefault: "Opponent",
    moreTools: "More volleyball tools",
  },
  live: {
    resetMatch: "Reset Match",
    finishMatch: "Finish Match Early",
    serving: "SERVING",
    point: "POINT",
    undoLast: "Undo Last Point",
    swapSides: "Swap Sides",
    timeout: "Timeout",
    timeoutTitle: "Timeout",
    timeoutPrompt: "Which team used the timeout?",
  },
  recording: {
    ourPoint: "Our Point!",
    opponentPoint: "Opponent's Point",
    howItHappened: "How did the point happen?",
    receiveQuality: "Receive Quality",
    receiveQualityDetail: "Rate receive quality",
    sideoutDetail: "Sideout Detail",
    additionalDetails: "Additional Details",
    wasItSideout: "Was it Sideout?",
    scoredFirstAttempt: "(Point on first attempt)",
    wasThereCover: "Was there cover?",
    whyDidTheyScore: "Why did they score?",
    goodSpike: "Good Spike",
    failedReceive: "Failed Receive",
    error: "Error",
    errorDetail: "Which error caused the point?",
    fault: "Fault",
    faultDetail: "Which fault caused the point?",
    passA: "Pass A",
    passB: "Pass B",
    passC: "Pass C",
  },
  analysis: {
    title: "Match Analysis",
    backToMatch: "Back to Match",
    allMatch: "All Match",
    exportJson: "Export JSON",
    newMatch: "New Match",
    summary: "Summary",
    totalPoints: "Total points recorded",
    scoringDist: "Scoring Distribution",
    errorDist: "Error Distribution",
    receiveQualityDist: "Receive Quality (A/B/C)",
    pointsPerSet: "Points per Set",
    ourScore: "Our Score",
    opponentScore: "Opponent's Score",
    setScoreFlow: "Set Score Flow",
    fullView: "Full View",
    precisionView: "Precision View",
    visiblePoints: "Visible points",
    clickPointHint: "Click any point in the line to see how it was scored.",
    noPointsInSet: "No points have been recorded in this set yet.",
    pointDetails: "Point Details",
    pointLabel: "Point",
    scoredBy: "Scored by",
    servingTeam: "Serving team",
    reasonLabel: "Reason",
    scoreAfterPoint: "Score after point",
    setFlowXAxis: "Points played in the set",
    setFlowYAxis: "Score up to the winning total",
    timeoutLabel: "Timeout",
    timeoutCalledBy: "Timeout called by",
    detailedStats: "Detailed Stats",
    blocks: "Blocks",
    blockOuts: "Block Outs",
    spikeKills: "Spike Kills",
    spikeTips: "Spike Tips",
    aces: "Aces",
    setDumps: "Set Dumps",
    opponentErrors: "Opponent Errors",
    sideouts: "Sideouts (point at 1st)",
    receiveQuality: "Receive Quality",
    blockOutAgainst: "Block out against us",
    coverExisted: "There was cover on blocks against us",
    opponentSpikeKills: "Spike kills by opponent",
    opponentSpikeTips: "Spike tips by opponent",
    faults: "Faults",
    pointsGiven: "Points given to opponent",
    resumeMatch: "Resume Match",
  },
  reasons: {
    block: "Block",
    block_out: "Block Out",
    spike_kill: "Spike Kill",
    spike_tip: "Spike Tip",
    ace: "Ace",
    set_dump: "Set Dump",
    opponent_error: "Opponent Error",
    block_against: "Block Against Us",
    block_out_against: "Block Out Against Us",
    spike_kill_against: "Spike Kill Against Us",
    spike_tip_against: "Spike Tip Against Us",
    missed_free_ball: "Missed Free Ball",
    ball_into_net: "Ball into Net",
    ball_out_of_bounds: "Ball Out of Bounds",
    bad_set: "Bad Set",
    serve_miss: "Serve Miss",
    net_touch: "Net Touch",
    backline_fault: "Backline Fault",
    center_line_violation: "Center Line Violation",
    over_the_net_fault: "Over-the-Net Fault",
    four_touches: "4 Touches",
    double_touch: "Double Touch",
  }
};
