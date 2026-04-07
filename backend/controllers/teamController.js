const teamModel = require("../models/teamModel"); 

// 그룹 생성
exports.createTeam = async(req,res) => {
    const errors = validateTeam(req.body);

    if(errors.length)
        return res.status(400).json({errors});

    try {
        const teamData = req.body;
        const { team_name } = req.body;
        const created_by = 1; // 그룹 생성자,실제로는 로그인 세션에서 가져올 예정
        // JWT 적용 코드
        // const created_by = req.user.user_id;

        // 그룹명 중복 확인
        const isDuplicate = await teamModel.checkGroupNameExists(created_by, team_name);
        if (isDuplicate) {
            return res.status(400).json({ 
                error: "중복된 그룹명",
                message: "동일한 그룹명 존재" 
            });
        }
        // 중복 아닐 경우 그룹 생성
        const create_result = await teamModel.create(teamData,created_by);
        res.status(200).json({
            message : "그룹 생성 완료",
            result : create_result,
            res : "오류없음"
        })
    } catch(err) {
        console.error("그룹 생성 실패",err);
        res.status(500).json({error : "생성실패" });
    }
};

// 내그룹 목록 조회
exports.getTeamList = async(req,res) => {
    try {
        const user_id = 1;
        //const {user_id} = req.body;
        const results = await teamModel.findMyTeam(user_id);
        res.json(results);
    } catch(err) {
        console.error("내그룹 목록 조회 실패",err)
        res.status(500).json({error:"내그룹 목록 조회 실패"});
    }
};

// 그룹 수정
exports.updateTeam = async(req,res) => {
    const errors = validateTeam(req.body,true);
    if(errors.length)
        return res.status(400).json({errors});

    try {
        const update_result = await teamModel.update(req.params.team_id, req.body);
        res.status(200).json({
            message : "그룹 정보 수정 완료",
            result : update_result,
            res : "오류없음"
        });
    } catch(err) {
        console.error("그룹 정보 수정 실패",err);
        res.status(500).json({error:"정보 수정 실패"});
    }
};

//그룹삭제
exports.deleteTeam = async(req,res) => {
    try {
        const delete_result = await teamModel.remove(req.params.team_id);
        res.status(200).json({
            message : "삭제 완료",
            result : delete_result,
            res : "삭제완료"
        });
    } catch (err) {
        console.error("삭제 실패",err);
        res.status(500).json({error : "삭제실패"})
    }
};

// 선택한 그룹에서 멤버 조회
exports.getTeamMembers = async(req,res) => {
    try {
        const {team_id} = req.params;
        const results = await teamModel.findTeamMembers(team_id);
        res.json(results);
    } catch {
        console.error("그룹 멤버 조회 실패", err);
        res.status(500).json({ error: "그룹 멤버 조회 실패" });
    }
}



// validation
function validateTeam(team,isUpdate = false) {
    // 그룹이름 검증(아예 없거나 공백,null 모두 불가)
    const errors = [];
    if (!team.team_name || team.team_name.trim() === "") {
        errors.push("그룹 이름을 입력하세요.");
    }
    if(!isUpdate && !team.team_color) {
        errors.push("그룹 색상을 선택하세요.");
    }
    return errors;
}