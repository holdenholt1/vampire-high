#!/usr/bin/env python3
"""
Generate a printable one-page rules PDF for Vampire High.
Uses WeasyPrint to convert HTML to PDF.
"""

from weasyprint import HTML, CSS
from pathlib import Path
import sys

# HTML content for the rules sheet
html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vampire High - Rules</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: white;
            color: #1a1a1a;
            line-height: 1.4;
            font-size: 11px;
        }
        
        .page {
            width: 8.5in;
            height: 11in;
            padding: 0.4in;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 0.15in;
            border-bottom: 2px solid #8b0000;
            padding-bottom: 0.1in;
        }
        
        .header h1 {
            font-size: 24px;
            color: #8b0000;
            margin-bottom: 0.05in;
            font-weight: bold;
        }
        
        .header p {
            font-size: 9px;
            color: #666;
            font-style: italic;
        }
        
        .columns {
            display: flex;
            gap: 0.2in;
            margin-top: 0.1in;
        }
        
        .column {
            flex: 1;
        }
        
        .section {
            margin-bottom: 0.12in;
        }
        
        .section h2 {
            font-size: 12px;
            color: #8b0000;
            margin-bottom: 0.05in;
            font-weight: bold;
            border-bottom: 1px solid #ddd;
            padding-bottom: 0.02in;
        }
        
        .section p {
            font-size: 10px;
            margin-bottom: 0.04in;
            line-height: 1.3;
        }
        
        .role {
            margin-bottom: 0.08in;
            padding: 0.05in;
            background: #f9f9f9;
            border-left: 2px solid #8b0000;
            padding-left: 0.08in;
        }
        
        .role-name {
            font-weight: bold;
            font-size: 10px;
            color: #8b0000;
        }
        
        .role-ability {
            font-size: 9px;
            color: #333;
            margin-top: 0.02in;
        }
        
        .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 0.05in;
            margin: 0.05in 0;
            font-size: 9px;
            border-radius: 2px;
        }
        
        .vampire-note {
            background: #ffe0e0;
            border: 1px solid #8b0000;
            padding: 0.05in;
            margin: 0.05in 0;
            font-size: 9px;
            border-radius: 2px;
            font-weight: bold;
        }
        
        .footer {
            text-align: center;
            font-size: 8px;
            color: #999;
            margin-top: 0.1in;
            padding-top: 0.05in;
            border-top: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <h1>🧛 VAMPIRE HIGH 🧛</h1>
            <p>A Social Deduction Game for 4–10 Players</p>
        </div>
        
        <div class="columns">
            <div class="column">
                <!-- LEFT COLUMN -->
                
                <div class="section">
                    <h2>OBJECTIVE</h2>
                    <p><strong>High School:</strong> Identify and eliminate the Vampire before they take over.</p>
                    <p><strong>Vampire:</strong> Survive until only 1 other player remains alive.</p>
                </div>
                
                <div class="section">
                    <h2>GAME FLOW</h2>
                    <p><strong>1. Discussion (3 min):</strong> Players discuss and debate who might be the Vampire. Use abilities during this phase.</p>
                    <p><strong>2. Voting (90 sec):</strong> All eligible players vote secretly to eliminate someone. Votes must be unanimous—if not, the Vampire's target dies instead.</p>
                    <p><strong>3. Round End:</strong> Results are revealed. If the Vampire survives, they kill one player.</p>
                    <p><strong>4. Repeat:</strong> Continue until someone wins.</p>
                </div>
                
                <div class="section">
                    <h2>CORE RULES</h2>
                    <p>✓ <strong>YOU MUST ROLEPLAY YOUR CHARACTER:</strong> Stay in character throughout the game. This is a roleplay game!</p>
                    <p>✓ <strong>NEVER STATE YOUR ROLE:</strong> Do not reveal your role directly. Use roleplay, deception, and strategy instead.</p>
                    <p>✓ <strong>Unanimous Voting:</strong> ALL non-Vampire eligible voters must agree on the same person to eliminate them. Otherwise, the Vampire's target dies.</p>
                    <p>✓ <strong>One Vampire:</strong> Exactly one player is the Vampire among 10 roles.</p>
                    <p>✓ <strong>Dead Players:</strong> Eliminated players cannot vote or use abilities.</p>
                </div>
                
                <div class="section">
                    <h2>THE 10 ROLES</h2>
                    
                    <div class="role">
                        <div class="role-name">👑 Homecoming Queen</div>
                        <div class="role-ability">Force one player to reveal if they are the Vampire (once per game).</div>
                    </div>
                    
                    <div class="role">
                        <div class="role-name">👊 Bully</div>
                        <div class="role-ability">Block one player from initiating votes this round.</div>
                    </div>
                    
                    <div class="role">
                        <div class="role-name">🔫 School Shooter</div>
                        <div class="role-ability">Shoot and kill any player (once per game). You die too.</div>
                    </div>
                    
                    <div class="role">
                        <div class="role-name">🧮 Mathlete</div>
                        <div class="role-ability">View all unused roles (once per game, visible for 30 seconds).</div>
                    </div>
                    
                    <div class="role">
                        <div class="role-name">📚 Teacher</div>
                        <div class="role-ability">Detain one player for 60 seconds (can't use abilities).</div>
                    </div>
                </div>
            </div>
            
            <div class="column">
                <!-- RIGHT COLUMN -->
                
                <div class="section">
                    <h2>THE 10 ROLES (cont.)</h2>
                    
                    <div class="role">
                        <div class="role-name">💅 Dumb Hoe</div>
                        <div class="role-ability">Peek at one player's role (resets each round). <strong>Cannot vote.</strong></div>
                    </div>
                    
                    <div class="role">
                        <div class="role-name">🏈 Dumb Jock</div>
                        <div class="role-ability">Intimidate one player so they can't vote this round. <strong>Cannot vote.</strong></div>
                    </div>
                    
                    <div class="role">
                        <div class="role-name">🎓 Principal</div>
                        <div class="role-ability">Your vote counts as 2 when voting.</div>
                    </div>
                    
                    <div class="role">
                        <div class="role-name">🧑‍⚕️ School Counselor</div>
                        <div class="role-ability">Pull one player to your office for 60 seconds (you both can't use abilities).</div>
                    </div>
                    
                    <div class="role">
                        <div class="role-name">🧛 Vampire</div>
                        <div class="role-ability"><strong>Can use ANY ability to fake their identity.</strong> If the Vampire survives voting, they kill one player.</div>
                    </div>
                </div>
                
                <div class="vampire-note">
                    ⚠️ ROLEPLAY RULE: You must stay in character and roleplay your role. Never directly state your role—use your personality and abilities to convince others of your innocence or guilt!
                </div>
                
                <div class="vampire-note">
                    ⚠️ VAMPIRE POWER: The Vampire can use any of the 8 abilities to disguise themselves. Using abilities can expose you, so choose wisely!
                </div>
                
                <div class="section">
                    <h2>VOTING RULES</h2>
                    <p><strong>Dumb Hoe & Dumb Jock cannot vote.</strong></p>
                    <p><strong>Unanimity Required:</strong> If all eligible voters choose the same person, they are eliminated.</p>
                    <p><strong>Not Unanimous?</strong> The Vampire's secret target is killed instead.</p>
                    <p><strong>Principal's Vote:</strong> Counts as 2 votes.</p>
                </div>
                
                <div class="section">
                    <h2>WIN CONDITIONS</h2>
                    <p>🏫 <strong>High School Wins:</strong> The Vampire is eliminated by vote.</p>
                    <p>🧛 <strong>Vampire Wins:</strong> Only 2 players remain alive (Vampire + 1 other).</p>
                </div>
                
                <div class="section">
                    <h2>TIPS</h2>
                    <p>• Discuss and debate—social deduction is the game!</p>
                    <p>• Use abilities strategically to gather info or protect allies.</p>
                    <p>• The Vampire must balance using abilities with staying hidden.</p>
                    <p>• Watch for suspicious voting patterns and ability usage.</p>
                </div>
            </div>
        </div>
        
        <div class="footer">
            Vampire High v1.0 | A social deduction game where blood and betrayal line the hallways of high school.
        </div>
    </div>
</body>
</html>
"""

def generate_pdf():
    """Generate the rules PDF."""
    output_path = Path(__file__).parent / "public" / "vampire-high-rules.pdf"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        HTML(string=html_content).write_pdf(str(output_path))
        print(f"✓ Rules PDF generated: {output_path}")
        return True
    except Exception as e:
        print(f"✗ Error generating PDF: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    success = generate_pdf()
    sys.exit(0 if success else 1)
