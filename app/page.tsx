import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand} aria-label="Studdy home">
            <span className={styles.brandMark} aria-hidden="true" />
            <span>Studdy</span>
          </div>

          <nav className={styles.nav} aria-label="Main navigation">
            <Link href="/" className={`${styles.navItem} ${styles.navItemActive}`}>
              Home
            </Link>
            <Link href="/quiz" className={styles.navItem}>
              Generate Quiz
            </Link>
            <Link href="/explain" className={styles.navItem}>
              Explain Text
            </Link>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            Meet your new study companion
          </div>

          <h1 id="hero-title" className={styles.title}>
            Study Smarter.
            <br />
            Understand Better.
          </h1>

          <p className={styles.subtitle}>
            Turn your notes into practice questions or simplify difficult text with AI.
          </p>

          <div className={styles.ctaRow}>
            <Link href="/quiz" className={styles.primaryAction} aria-label="Generate a quiz">
              <span aria-hidden="true">＋</span> Generate a Quiz
            </Link>

            <Link href="/explain" className={styles.secondaryAction} aria-label="Explain text">
              <span aria-hidden="true">⌁</span> Explain Text
            </Link>
          </div>
        </section>

        <section className={styles.cards} aria-label="Studdy feature cards">
          <article className={styles.card}>
            <div className={styles.cardIcon} aria-hidden="true">
              ✎
            </div>
            <h2 className={styles.cardTitle}>Generate Quiz</h2>
            <p className={styles.cardBody}>
              Upload or paste your study notes, textbooks, or essays. Our smart AI analyzes the text and
              instantly crafts mixed-format assessments to test your knowledge retention.
            </p>
            <Link href="/quiz" className={styles.cardAction}>
              <span className={styles.cardActionArrow} aria-hidden="true">
                →
              </span>
              Try Quiz Generator
            </Link>
          </article>

          <article className={styles.card}>
            <div className={styles.cardIcon} aria-hidden="true">
              ◌
            </div>
            <h2 className={styles.cardTitle}>Explain Difficult Text</h2>
            <p className={styles.cardBody}>
              Struggling with dense academic literature, contracts, or complex jargon? Paste the snippet and
              watch Study break it down into clear, plain-language insights.
            </p>
            <Link href="/explain" className={styles.cardAction}>
              <span className={styles.cardActionArrow} aria-hidden="true">
                →
              </span>
              Try Text Explainer
            </Link>
          </article>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>Studdy</div>
          <div>© 2026 Studdy AI. Designed for modern learning.</div>
        </div>
      </footer>
    </div>
  );
}
