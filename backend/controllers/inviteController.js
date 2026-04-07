const inviteModel = require('../models/inviteModel');


// 초대장 발송
exports.sendInvite = async(req,res) => {
    const errors = validateInvite(req.body,true);
    if (errors.length) {
        return res.status(400).json({ errors });
    }

    try {
        const inviteData = req.body;

        // 입력받은 이메일로 유저 정보 찾기
        const targetUser = await inviteModel.getUserByEmail(inviteData.invitee_email);
        // 가입 안한 user 일경우
        if (!targetUser) {
            return res.status(404).json({ errors: ["가입하지 않은 사용자입니다."] });
        }
        inviteData.inviter_id = 1; // test용,나중에 로그인 세션값으로 교체
        inviteData.invitee_id = targetUser.user_id;

        // 이미 초대된 id인지 구분
        const existing = await inviteModel.findByTarget(inviteData.team_id, inviteData.invitee_id);
        if (existing.length > 0) {
            return res.status(400).json({ errors: ["이미 초대한 사용자입니다."] });
        }
        
        const invite_result = await inviteModel.create(inviteData);
        res.status(200).json({
            message : "초대장 발송 완료",
            result : invite_result,
            res : "오류없음"
        })

    } catch(err) {
        console.error("초대장 발송 실패",err);
        res.status(500).json({error : "발송실패"});
    }

    
}

// 초대장 수락,거절
exports.inviteResponse = async(req,res) => {
    try {
        const responseData = req.body;
        const response_result = await inviteModel.responseStatus(responseData);

        // 초대장 수락시 멤버로 등록
        if (responseData.status==='ACCEPTED') {
            const inviteInfo = await inviteModel.getInviteById(responseData.invite_id);
            console.log("초대 정보 조회 결과:", inviteInfo);

            if(inviteInfo) {
                await inviteModel.addteam_members(inviteInfo.team_id,inviteInfo.invitee_id);
                console.log("그룹 멤버 등록 성공")
            } else {
                console.log("초대 정보 찾지 못함")
            }
        }

        const statusTest = responseData.status === 'ACCEPTED' ? '수락' : '거절';
        res.status(200).json ({
            message : `초대를 ${statusTest} 했습니다`,
            result : response_result,
            res : "오류없음"
        });
    } catch(err) {
        console.error("초대 처리 중 오류")
        res.status(500).json({error : "초대 처리 중 오류"})
    }
}

// 내가 보낸 초대 목록 조회
exports.sendInviteList = async(req,res) => {
    const {user_id,team_id} = req.query;
    const results = await inviteModel.findSendInviteList(user_id,team_id);
    res.json(results);
}

// 내가 받은 초대 목록 조회
exports.receiveInviteList = async(req,res) => {
    const {user_id} = req.query;
    const results = await inviteModel.findReceivedInviteList(user_id);
    res.json(results)
}


// validation , 초대장 수락 거절할 때도 validation 해야하나..?
function validateInvite(invite) {
    const errors = [];
    // 그룹 선택 필수
    if (!invite.team_id) {
        errors.push("초대할 그룹을 선택하세요.");
    }
    
    return errors;
}