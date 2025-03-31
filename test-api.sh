#!/bin/bash

# ベースURLを設定
BASE_URL="http://localhost:3000"

# GETリクエスト
echo "GETリクエストを送信中..."
curl -X GET "${BASE_URL}/api/users/me" \
  --cookie "next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..n7PH1w8TL5RPlQ99.uhqxmHskRsqdemLS3Vuhe62MIxrVXT5R-aQ_DP-iq1WEg998tdvfBXviR799JLUt64VZ30858Ifm6eP_kbAxk1cIa_Hu9-TDu0MvefeVLGA8xGDRMxdZCczV8DtZm0vFl3O6NT5ruDA9fPgdRWMsovkEYScAlvBUL0VqZJIHkRYt6dJ9PWSoTOAJoX7GCloB5TfEZpVPJS5EpL3Qg4Xx2fpQqq7rc1RQlRdMc1jcFgVuT9kZHww64JbD8zASMQewEytPolYrGWsnYcp-V6l9gNm0sqKDiiDl4qcnbNlqD7_PSi4nO4VoKTatku4ROLOYex5DT5n0SOyIou0Rs1TUNgVsOSsKr5gvSRkM.KHY7RyAKLirJlVZLCdTR7g" \
  | jq .

# # PUTリクエスト
# echo -e "\nPUTリクエストを送信中..."
# curl -X PUT "${BASE_URL}/api/users/me" \
#   --cookie "next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..n7PH1w8TL5RPlQ99.uhqxmHskRsqdemLS3Vuhe62MIxrVXT5R-aQ_DP-iq1WEg998tdvfBXviR799JLUt64VZ30858Ifm6eP_kbAxk1cIa_Hu9-TDu0MvefeVLGA8xGDRMxdZCczV8DtZm0vFl3O6NT5ruDA9fPgdRWMsovkEYScAlvBUL0VqZJIHkRYt6dJ9PWSoTOAJoX7GCloB5TfEZpVPJS5EpL3Qg4Xx2fpQqq7rc1RQlRdMc1jcFgVuT9kZHww64JbD8zASMQewEytPolYrGWsnYcp-V6l9gNm0sqKDiiDl4qcnbNlqD7_PSi4nO4VoKTatku4ROLOYex5DT5n0SOyIou0Rs1TUNgVsOSsKr5gvSRkM.KHY7RyAKLirJlVZLCdTR7g" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "name": "テストユーザー",
#     "selfIntroduction": "これはテスト用の自己紹介です",
#     "age": 25,
#     "ageVisible": true,
#     "skills": ["JavaScript", "TypeScript", "React"],
#     "interests": ["Web開発", "AI"]
#   }' \
#   | jq . 