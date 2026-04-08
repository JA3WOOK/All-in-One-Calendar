const memberModel = require('../models/memberModel');

exports.updateRole = async (req,res) => {
   
   try{
    const updateData = req.body;
    const update_result = await memberModel.update(updateData);

     res.status(200).json({
        message : "권한 수정 완료",
        result : update_result,
        res : "오류없음"
    });
   } catch (err) {
    console.error("권한 수정 실패",err);
    res.status(500).json({error:"권한 수정 실패"})
   }
}

   exports.deleteMember = async(req,res) => {

     try {
            const deleteData = req.body;
            const delete_result = await memberModel.remove(deleteData);
            res.status(200).json({
                message : "삭제 완료",
                result : delete_result,
                res : "삭제완료"
            });
        } catch (err) {
            console.error("삭제 실패",err);
            res.status(500).json({error : "삭제실패"})
        }
   }

   
