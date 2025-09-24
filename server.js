const express = require("express");
const { app, server } = require("./src/socket/socket")
require("./src/config/db");
require('dotenv').config();
const PORT = process.env.PORT
const cors = require('cors')


app.use(express.json());

app.use(cors())

app.use('/document', express.static('./public/upload/document'))
app.use('/teamPhoto', express.static('./public/upload/teamPhoto'))
app.use('/playerPhoto', express.static('public/upload/playerPhoto'))
app.use('/userImage', express.static('./public/upload/userImage'))
app.use('/ads', express.static('./public/upload/advertisePhoto'))

app.get('/', (req, res) => {
    res.send("health check!!!")
})
const adminRouter = require("./src/routes/adminRouter");
app.use("/api/admin", adminRouter)

const userRouter = require("./src/routes/userRouter")
app.use("/api/user", userRouter)

const walletRouter = require("./src/routes/walletRouter")
app.use("/api/wallet", walletRouter)

const transactionRouter = require("./src/routes/transactionRouter")
app.use("/api/transaction", transactionRouter)

const documentRouter = require("./src/routes/documentRouter");
app.use("/api/document", documentRouter)

const chatRouter = require("./src/routes/groupchatRouter");
app.use("/api/chat", chatRouter)

const leaguetRouter = require("./src/routes/leagueRouter");
app.use("/api/league", leaguetRouter)

const matchtRouter = require("./src/routes/matchRouter");
app.use("/api/match", matchtRouter)

const teamRouter = require("./src/routes/teamRouter");
app.use("/api/team", teamRouter)

const playerRouter = require("./src/routes/playerRouter");
app.use("/api/player", playerRouter)

const notificationRouter = require("./src/routes/notificationRouter");
app.use("/api/notification", notificationRouter)

const teamPlayerRouter = require("./src/routes/teamPlayerRouter");
app.use("/api/teamPlayer", teamPlayerRouter)

const myTeamRouter = require("./src/routes/myteamRouter");
app.use("/api/myTeam", myTeamRouter)

const contestTypeRouter = require("./src/routes/contestTypeRouter");
app.use("/api/contestType", contestTypeRouter)

const contestRouter = require("./src/routes/contestRouter");
app.use("/api/contest", contestRouter)

const joinContestRouter = require("./src/routes/joinContestRouter");
app.use("/api/joinContest", joinContestRouter)

const winningPriceRangeRouter = require("./src/routes/Winning_price_range_router");
app.use("/api/winngPriceRange", winningPriceRangeRouter)

const winningPriceRouter = require("./src/routes/winning_price_router");
app.use("/api/winngPrice", winningPriceRouter)

const contestDetailsRouter = require("./src/routes/contest_details_router");
app.use("/api/contestDetails", contestDetailsRouter)

const scoreBoardRouter = require("./src/routes/scoreBoardRouter");
app.use("/api/scoreboard", scoreBoardRouter)

const scoreCardRouter = require("./src/routes/scoreCardRouter");
app.use("/api/scorecard", scoreCardRouter)

const matchScoreRouter = require("./src/routes/matchScoreRouter");
app.use("/api/matchscore", matchScoreRouter)

const matchTypeRouter = require("./src/routes/matchTypeRouter");
app.use("/api/matchtype", matchTypeRouter)

const pointForRouter = require("./src/routes/pointForRouter");
app.use("/api/pointfor", pointForRouter)

const pointSystemRouter = require("./src/routes/pointSystemRouter");
app.use("/api/pointsystem", pointSystemRouter)

const pointTypeRouter = require("./src/routes/pointTypeRouter");
app.use("/api/pointtype", pointTypeRouter)

const playerPointsRouter = require("./src/routes/playerPointsRouter");
app.use("/api/playerpoints", playerPointsRouter)

const referAndEarnRouter = require("./src/routes/refer_and_earn_router");
app.use("/api/referAndEarn", referAndEarnRouter)

const communityGuidelinesRouter = require("./src/routes/community_guidelines_router");
app.use("/api/communityGuidelines", communityGuidelinesRouter)

const aboutUsRouter = require("./src/routes/about_us_router");
app.use("/api/about_us", aboutUsRouter)

const helpAndSupportRouter = require("./src/routes/help_and_support_router");
app.use("/api/help_and_support", helpAndSupportRouter)


const termsAndConditionRouter = require('./src/routes/terms_and_condition_router');
app.use("/api/terms_and_condition", termsAndConditionRouter)

const withdrawDetailsController = require("./src/routes/withdraw_details_router");
app.use("/api/withdraw_details", withdrawDetailsController)

const writeToUsRouter = require("./src/routes/write_to_us_router");
app.use("/api/write_to_us", writeToUsRouter)

const coinAddSystemRouter = require("./src/routes/coin_add_system_router");
app.use("/api/coinAddSystem", coinAddSystemRouter)

const loginHistoryRouter = require("./src/routes/login_history_router");
app.use("/api/loginHistory", loginHistoryRouter)

const advertiseRouter = require("./src/routes/advertise_router");
app.use("/api/advertise", advertiseRouter)

const manualPaymentRouter = require("./src/routes/manual_payment_router");
app.use("/api/manualPayment", manualPaymentRouter)

server.listen(PORT, () => {
    console.log(`Server Running Port No.${PORT}`);
})