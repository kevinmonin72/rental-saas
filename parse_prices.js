const fs = require('fs');

const raw = `
1 day:
Stock : 15\n18.75 €\nBoardbag opt.\nBoardbag opt.\n
Stock : 50\n98.75 €\nPack Kitesurf - à personnaliser ✨\nPack Kitesurf - à personnaliser ✨\n
Stock : 50\n73.75 €\nAile + Barre\nAile + Barre\n
Stock : 50\n98.75 €\nPack 2 Ailes + Barre\nPack 2 Ailes + Barre\n
Stock : 20\n37.50 €\nPlanche Twintip\nPlanche Twintip\n
Stock : 49\n61.25 €\nAile de Wing\nAile de Wing\n
Stock : 50\n23.75 €\nHarnais culotte\nHarnais culotte\n
Stock : 50\n31.25 €\nDeuxième aile (sans barre)\nDeuxième aile (sans barre)\n
Stock : 60\n23.75 €\nCombinaison\nCombinaison\n
Stock : 49\n98.75 €\nPack Wing gonflable \nPack Wing gonflable\n
Stock : 50\n11.25 €\nCagoule\nCagoule\n
Stock : 45\n98.75 €\nPack Wing rigide\nPack Wing rigide\n
Stock : 25\n48.75 €\nPack Wing débutant\nPack Wing débutant\n
Stock : 25\n61.25 €\nFoil de Wing\nFoil de Wing\n
Stock : 49\n61.25 €\nPlanche de Wing\nPlanche de Wing\n
Stock : 25\n31.25 €\nDeuxième Aile de Wing \nDeuxième Aile de Wing\n
Stock : 15\n8.75 €\nCagoule opt.\nCagoule opt.\n
Stock : 15\n8.75 €\nChaussons opt.\nChaussons opt.\n
Stock : 15\n8.75 €\nGants opt.\nGants opt.\n
Stock : 50\n23.75 €\nHarnais ceinture\nHarnais ceinture\n
Stock : 25\n23.75 €\nVeste néoprène\nVeste néoprène\n
Stock : 25\n11.25 €\nChaussons\nChaussons\n
Stock : 25\n23.75 €\nCombinaison opt.\nCombinaison opt.\n
Stock : 25\n23.75 €\nBoardbag\nBoardbag\n
Stock : 25\n11.25 €\nGants\nGants\n
Stock : 25\n23.75 €\nHarnais ceinture opt.\nHarnais ceinture opt.\n
Stock : 50\n18.75 €\nCasque\nCasque\n
Stock : 15\n18.75 €\nVeste Néoprène opt.\nVeste Néoprène opt.\n
Stock : 50\n18.75 €\nGilet\nGilet\n
Stock : 25\n7.50 €\nCasque opt.\nCasque opt.\n
Stock : 50\n6.25 €\nGilet opt.\nGilet opt.\n
Stock : 25\n6.25 €\nHarnais Culotte opt.\nHarnais Culotte opt.\n
Stock : 50\n31.25 €\nTroisième aile (sans barre)\nTroisième aile (sans barre)\n
Stock : 15\n73.75 €\nAile + Barre\nAile + Barre\n
Stock : 15\n98.75 €\nPack Wing gonflable\nPack Wing gonflable\n
Stock : 15\n31.25 €\nDeuxième aile (sans barre) - carte session\nDeuxième aile (sans barre) - carte session\n
Stock : 15\n31.25 €\nTroisième aile (sans barre) - carte session\nTroisième aile (sans barre) - carte session\n
25.00 €\nPlanche Twintip opt. - carte session\nPlanche Twintip opt. - carte session\n
Stock : 15\n31.25 €\nDeuxième Aile de Wing  - carte session\nDeuxième Aile de Wing - carte session\n
Stock : 4\n0.00 €\nInitiation foil tracté\nInitiation foil tracté\n
Stock : 50\n36.25 €\nBarre \nBarre\n
Stock : 20\n86.25 €\nKitefoil \nKitefoil\n
Stock : 20\n48.75 €\nStrapless\nStrapless\n
Stock : 20\n25.00 €\nPlanche Twintip Opt.\nPlanche Twintip Opt.\n
Stock : 51\n73.75 €\nPlanche + Foil de Wing \nPlanche + Foil de Wing\n
Stock : 25\n50.00 €\nPaddle \nPaddle\n
Stock : 50\n37.50 €\nSurf \nSurf\n
`
