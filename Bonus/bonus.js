const canJump = function (nums) {
    let max = 0;

    for (let i = 0; i < nums.length; i++) {
        if (i > max) return false;
        max = Math.max(max, i + nums[i]); 
        if (max >= nums.length - 1) return true;
    }

    return false;
};

console.log(canJump([2, 3, 1, 1, 4])); 
 console.log(canJump([3, 2, 1, 0, 4])); 

