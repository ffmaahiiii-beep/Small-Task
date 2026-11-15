const tasks = [
  { title: "Visit a website and answer a question", category: "Website", reward: "0.10", time: "2 min", slots: 42 },
  { title: "Watch a short video and share feedback", category: "Video", reward: "0.25", time: "5 min", slots: 18 },
  { title: "Complete a short product survey", category: "Survey", reward: "0.50", time: "8 min", slots: 25 },
  { title: "Test a mobile app and submit feedback", category: "App testing", reward: "1.20", time: "15 min", slots: 9 }
];

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#"><span className="brandMark">S</span> Small Task</a>
        <nav><a href="#tasks">Browse tasks</a><a href="#how">How it works</a><a className="login" href="#account">Log in</a></nav>
      </header>

      <section className="hero">
        <div className="heroCopy">
          <span className="eyebrow">SMALL TASKS. REAL REWARDS.</span>
          <h1>Turn your free time into <em>earnings.</em></h1>
          <p>Find simple online tasks, submit your work, and earn rewards when your submission is approved.</p>
          <div className="heroActions"><a className="primary" href="#tasks">Explore tasks <span>↗</span></a><a className="secondary" href="#how">How it works</a></div>
          <div className="trust"><span>✓</span> Clear rewards · Reviewed submissions · USD wallet</div>
        </div>
        <div className="walletCard">
          <div className="walletTop"><span>YOUR EARNING WALLET</span><span className="liveDot">● DEMO</span></div>
          <div className="balance">$12.80</div>
          <div className="balanceCaption">Sample balance · Preview only</div>
          <div className="walletLine"></div>
          <div className="walletStats"><div><small>Tasks completed</small><b>24</b></div><div><small>Pending review</small><b>03</b></div></div>
          <div className="miniChart"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        </div>
        <div className="heroOrb orbOne"></div><div className="heroOrb orbTwo"></div>
      </section>

      <section className="stats">
        <div><b>Flexible</b><span>Work on your schedule</span></div><div><b>Many categories</b><span>Different kinds of tasks</span></div><div><b>USD rewards</b><span>Rewards shown in dollars</span></div><div><b>Reviewed work</b><span>Admin approval process</span></div>
      </section>

      <section className="section" id="tasks">
        <div className="sectionHead"><div><span className="eyebrow">GET STARTED</span><h2>Explore available tasks</h2><p>Choose a task that matches your time and skills.</p></div><a className="textLink" href="#account">View all tasks ↗</a></div>
        <div className="taskGrid">
          {tasks.map((task, i) => <article className="taskCard" key={task.title}>
            <div className="taskIcon">{["↗","▶","▤","⌘"][i]}</div><div className="taskCategory">{task.category}</div>
            <h3>{task.title}</h3><div className="taskMeta"><span>◷ {task.time}</span><span>{task.slots} slots</span></div>
            <div className="taskBottom"><div><small>REWARD</small><b>${task.reward}</b></div><a href="#account">View task ↗</a></div>
          </article>)}
        </div>
        <p className="demoNote">Preview content only. Real tasks, balances and withdrawals will load after Supabase setup.</p>
      </section>

      <section className="how" id="how"><span className="eyebrow">SIMPLE PROCESS</span><h2>How Small Task works</h2>
        <div className="steps"><div><span>01</span><h3>Create an account</h3><p>Register securely and access your task dashboard.</p></div><div><span>02</span><h3>Complete a task</h3><p>Follow the instructions and submit the required proof.</p></div><div><span>03</span><h3>Get approved</h3><p>Admin reviews your submission. Approved rewards enter your wallet.</p></div><div><span>04</span><h3>Request payout</h3><p>Request a withdrawal to your Binance Pay ID once eligible.</p></div></div>
      </section>

      <section className="cta" id="account"><div><span className="eyebrow">YOUR NEXT STEP</span><h2>Ready to get started?</h2><p>Account registration and live task features are the next build stage.</p></div><a className="primary" href="mailto:admin@example.com?subject=Small%20Task%20account%20setup">Contact admin ↗</a></section>
      <footer><a className="brand" href="#"><span className="brandMark">S</span> Small Task</a><span>© 2026 Small Task. Demo starter interface.</span><span>USD · Binance Pay ID withdrawals</span></footer>
    </main>
  );
}
