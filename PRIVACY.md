# Privacy Policy

**Word Hopper** ([https://wordhopper.baizeway.com](https://wordhopper.baizeway.com/))

Last updated: July 10, 2026

Word Hopper is a free browser game. This page explains what data is stored when you play, and why.

## Summary

- No accounts, no email, no passwords.
- We do **not** sell personal data.
- Most preferences stay in your browser (`localStorage`).
- If you submit a score, a nickname and run stats are stored on our server for the public leaderboard.
- A third-party counter (Busuanzi) loads on the site for approximate view/visitor counts.

## Data stored in your browser

The game uses `localStorage` on your device for:

| Key purpose | Examples |
|-------------|----------|
| Nickname | Auto-generated or the name you type |
| Mute preference | Sound on/off |
| Local best scores | Score, WPM, best word per difficulty |
| UI flags | Tutorial seen, nickname hint seen, build cache |

This data stays on your device unless you clear site data. We cannot read your `localStorage` from the server.

## Data sent to our server

When you start or finish a run that syncs with the leaderboard, the API may receive:

- **Nickname** (display name you chose or were assigned)
- **Difficulty**, **score**, **WPM**, **best word**
- A short-lived **run token** used to validate the submit
- **IP address** (used only for rate limiting / abuse prevention; associated with temporary run records)

Leaderboard entries are public: nickname and scores are shown to other players.

We do not ask for real names, emails, phone numbers, or payment details.

## Third-party services

The site loads **Busuanzi** (`busuanzi.ibruce.info`) to show approximate page views and unique visitors. That service may process request metadata (such as IP) according to its own practices. Word Hopper does not control Busuanzi’s data handling.

Share links may include score stats and nickname in the URL query string so a friend can open a result card. Anyone with the link can see that information.

## Cookies

Word Hopper itself does not set advertising or tracking cookies. Browser storage for the items above uses `localStorage`, not cookies. Third-party scripts (e.g. Busuanzi) may use their own mechanisms.

## Children

The game is a general typing runner. We do not knowingly collect personal information from children beyond the anonymous nickname and score data described above. Prefer a fun nickname that is not a real name or contact detail.

## Changes

We may update this policy as the game changes. The “Last updated” date at the top will change when we do.

## Contact

Questions or requests about this policy: open an issue on [GitHub](https://github.com/WingEdge777/wordhopper).
